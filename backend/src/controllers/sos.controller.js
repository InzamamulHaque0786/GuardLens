import sosModel from "../models/sos.model.js";
import userModel from "../models/user.model.js";
import twilio from "twilio";

// Initialize the Twilio client using your .env variables
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

export const triggerSOS = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Location is required to trigger SOS.",
      });
    }

    // Fetch the user and populate their emergency contacts
    const user = await userModel.findById(req.user.id);

    const newSOS = new sosModel({
      userId: req.user.id,
      initialLocation: { latitude, longitude },
      locationHistory: [{ latitude, longitude }],
    });

    await newSOS.save();

    // 1. Alert the Admin Dashboard via WebSockets
    const alertPayload = {
      sosId: newSOS._id,
      user: { name: user.name, phone: user.phone },
      location: { latitude, longitude },
      time: new Date(),
    };
    req.io.emit("emergency_sos_triggered", alertPayload);

    // 2. THE MAGIC: Send SMS to all Emergency Contacts
    if (user.emergencyContacts && user.emergencyContacts.length > 0) {
      // Create a Google Maps link using the coordinates
      const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const messageBody = `🚨 URGENT: ${user.name} has triggered an SOS alert on GuardLens! Their last known location: ${mapsLink}`;

      // Loop through contacts and send texts simultaneously using Promise.all
      const smsPromises = user.emergencyContacts.map((contact) => {
        return twilioClient.messages
          .create({
            body: messageBody,
            from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio Number
            to: contact.phoneNumber, // The Contact's Number
          })
          .catch((err) =>
            console.error(`Failed to text ${contact.name}:`, err),
          ); // Catch individual fails so it doesn't crash the loop
      });

      await Promise.all(smsPromises);
      console.log("Emergency SMS alerts dispatched.");
    }

    return res.status(201).json({
      success: true,
      message: "SOS Activated. Authorities and contacts have been notified.",
      data: { sosId: newSOS._id },
    });
  } catch (error) {
    console.error("SOS Trigger Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to trigger SOS." });
  }
};

// 2. Update Live Location (Called every 10 seconds by the frontend)
export const updateSOSLocation = async (req, res) => {
  try {
    const { sosId, latitude, longitude } = req.body;

    const updatedSOS = await sosModel.findByIdAndUpdate(
      sosId,
      { $push: { locationHistory: { latitude, longitude } } },
      { new: true },
    );

    // 🚨 Stream the new coordinates to the Admin map
    req.io.emit("emergency_sos_movement", {
      sosId,
      location: { latitude, longitude },
    });

    return res
      .status(200)
      .json({ success: true, message: "Location updated." });
  } catch (error) {
    console.error("SOS Update Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update location." });
  }
};

// 3. Cancel the SOS (Requires PIN)
export const cancelSOS = async (req, res) => {
  try {
    const { sosId, pin } = req.body;
    const user = await userModel.findById(req.user.id);

    // Verify the PIN (Assuming default is "1234" for now)
    if (user.sosPin !== pin) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid PIN. Cannot disable SOS." });
    }

    const resolvedSOS = await sosModel.findByIdAndUpdate(
      sosId,
      { status: "Resolved", resolvedAt: new Date() },
      { new: true },
    );

    // 🚨 Tell the admin dashboard to turn off the sirens
    req.io.emit("emergency_sos_resolved", { sosId });

    return res
      .status(200)
      .json({ success: true, message: "SOS Alert cancelled successfully." });
  } catch (error) {
    console.error("SOS Cancel Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to cancel SOS." });
  }
};
