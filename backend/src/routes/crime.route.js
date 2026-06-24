import express from "express"
import {verifyJWT,roleAuthorization} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
import {reportCrime,getAllMyReports,getReport,getCrimeLocations,getAllAdminReports,getAdminReport,updateReportStatus} from "../controllers/crime.controller.js"

const router = express.Router()

router.post('/report',verifyJWT,upload.fields([{name:"images",maxCount:5},{name:"video",maxCount:1}]),reportCrime)//report a crime
router.get('/my-reports',verifyJWT,getAllMyReports) // get my reported crimes list
router.get('/crime-locations',verifyJWT,getCrimeLocations)//get all verified crime reports location to show on map

router.get('/admin/reports',verifyJWT,roleAuthorization('admin'),getAllAdminReports)// admin gets all reported crimes according to his location domain
router.get('/admin/:id',verifyJWT,roleAuthorization('admin'),getAdminReport) // admin gets specifics of a crimereport
router.patch('/admin/:id',verifyJWT,roleAuthorization('admin'),updateReportStatus) // admin gets specifics of a crimereport

router.get('/:id',verifyJWT,getReport)//get specific crime report details

export default router