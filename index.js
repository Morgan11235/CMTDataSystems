const express = require('express');
const app = express();
app.set('view engine', 'pug')
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
require('dotenv').config();
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI 

//SCHEMAS AND MODELS
const { Schema } = mongoose;
const projectSchema = new Schema({
	projectNumber: String,
	projectName: String,
	projectClient: String,
	projectOwner: String,
	projectManager: String,
	projectSegment: String
}); 
const projectModel = mongoose.model('Project', projectSchema);

const scheduleSchema = new Schema({
		projectNumber: String,
		scheduleNumber: String,
		scheduleDate: Date,
		scheduleStartTime: String,
		scheduleEndTime: String,
		scheduleType: String,
		sampleAssigned: Boolean
});
const scheduleModel = mongoose.model('Schedule', scheduleSchema);

const sampleSchema = new Schema({
	projectNumber: String,
	scheduleNumber: String,
	sampleDate: String,
	sampleType: String, 
	sampleMaterial: String,
	sampleDescription: String,
	sampleTests: Array,
	sampleTestMethods: Array
});
const sampleModel = mongoose.model('Sample', sampleSchema);


/* /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\ 
	            FRONT PAGE DATABASE LIST GENERATION 
   /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

// PROJECT LIST
let projUid = [];
let projNumberArr = [];
let projNameArr = [];
let projClientArr = [];
let projOwnerArr = [];
let projManagerArr = [];
let projSegmentArr = [];
const generateProjectsList = function(req, res, next){
	 projectModel.find({}).exec().then((docs) => {
		for(var i=0; i<docs.length; i++){
			projNumberArr.push(docs[i]['projectNumber']);
			projNameArr.push(docs[i]['projectName']);
			projClientArr.push(docs[i]['projectClient']);
			projOwnerArr.push(docs[i]['projectOwner']);
			projManagerArr.push(docs[i]['projectManager']);
			projSegmentArr.push(docs[i]['projectSegment']);
			}}); 	
}

//SCHEDULE LIST
let schedProjNumberArr = [];
let schedNumberArr = [];
let schedDateArr = [];
let schedStartTimeArr = [];
let schedEndTimeArr = [];
let schedTypeArr = [];
const generateScheduleList = function(req, res, next){
	 scheduleModel.find({}).exec().then((docs) => {
		for(var i=0; i<docs.length; i++){
			schedProjNumberArr.push(docs[i]['projectNumber']);			
			schedNumberArr.push(docs[i]['scheduleNumber']);
			schedDateArr.push(docs[i]['scheduleDate']);
			schedStartTimeArr.push(docs[i]['scheduleStartTime']);
			schedEndTimeArr.push(docs[i]['scheduleEndTime']);
			schedTypeArr.push(docs[i]['scheduleType']);
			}});}
let unassignedPickupArr = [];
const generateUnassignedPickupList = function(req, res, next){
	scheduleModel.find({sampleAssigned: false}).exec().then((docs) => {
		for(var i=0; i<docs.length; i++){
			unassignedPickupArr.push(docs[i]['scheduleNumber'])
		}
	})
}

//UNASSIGNED SAMPLE PICKUPS

// Landing Page 
app.get('/', (req, res) => {
	try{
		mongoose.connect(uri);
	} catch (error) {
		handleError(error);
	}
	
  res.render(process.cwd() + '/views/Pug/index')
});

// Authorization and Opening DB Connection
app.post('/login', (req, res) => {
	//SETUP AUTHORIZATION
	res.redirect('/projects')
})

//PROJECTS ROUTES

app.get('/projects', (req, res, next) => {
	generateProjectsList(req, res)
	next()}, (req, res) =>
	{	
		res.render(process.cwd() + '/views/Pug/projects', {
		proNumber: projNumberArr,
		proName: projNameArr,
		proClient: projClientArr,
		proOwner: projOwnerArr,
		proManager: projManagerArr,
		proSegment: projSegmentArr
	});
		projNumberArr = [];
	 	projNameArr = [];
	 	projClientArr = [];
	 	projOwnerArr = [];
	 	projManagerArr = [];
	 	projSegmentArr = [];
	});
app.get('/newproject', (req, res) => {
	res.render(process.cwd() + '/views/Pug/createproject')
})
app.post('/createproject', (req, res) => {
	const proj = new projectModel({
		projectNumber: req.body.projectNumber,
		projectName: req.body.projectName,
		projectClient: req.body.projectClient,
		projectOwner: req.body.projectOwner,
		projectManager: req.body.projectManager,
		projectSegment: req.body.projectSegment
	})
	proj.save((error, newProject) => {
		if(error) throw error
		res.redirect('/projects');
	})
})

app.get('/projects/:projId', (req, res) => {
	let projId = req.params['projId'];
	res.send("Project Number: " + projId)
})


//SCHEDULE ROUTES
app.get('/schedule', (req, res, next) => {
	generateScheduleList(req, res)
	next()}, (req, res) =>
	{	
		res.render(process.cwd() + '/views/Pug/schedule', {
		schProNumber: schedProjNumberArr,
		schNumber: schedNumberArr,
		schDate: schedDateArr,
		schStartTime: schedStartTimeArr,
		schEndTime: schedEndTimeArr,
		schType: schedTypeArr
	});
		schedProjNumberArr = [];
		schedNumberArr = [];
		schedDateArr = [];
		schedStartTimeArr = [];
		schedEndTimeArr = [];
		schedTypeArr = [];
})

app.get('/newschedule', (req, res) => {
	res.render(process.cwd() + '/views/Pug/createschedule')
})

app.post('/createschedule', (req, res) => {
	const sched = new scheduleModel({
		projectNumber: req.body.projectNumber,
		scheduleNumber: req.body.scheduleNumber,
		scheduleDate: req.body.scheduleDate,
		scheduleStartTime: req.body.scheduleStartTime,
		scheduleEndTime: req.body.scheduleEndTime,
		scheduleType: req.body.scheduleType
	})
	sched.save((error, newProject) => {
		if(error) throw error
		res.redirect('/schedule');
	})
})

//SAMPLE ROUTES
app.get('/labsamples', (req, res) => {
	res.render(process.cwd() + '/views/Pug/labsamples')
})

app.get('/newsample', (req, res, next) => {
	generateUnassignedPickupList(req, res)
		next()},
			(req, res) => {
				res.render(process.cwd() + '/views/Pug/createsample', {
					unassigned: unassignedPickupArr 				
				});
				unassignedPickupArr = [];
	
})
app.post('/createsample', (req, res) => {
//ADD TESTS AND TEST METHODS TO ARRAYS	
	let testList = [];
	let methodList = [];
	if(req.body.proctor){
		testList.push(req.body.proctor);
		methodList.push(req.body.proctorTestMethod)
	}
	if(req.body.sieve){
		testList.push(req.body.sieve);
		methodList.push(req.body.sieveTestMethod)
	}
	if(req.body.organics){
		testList.push(req.body.organics);
		methodList.push(req.body.organicsTestMethod)
	}
	if(req.body.atterbergs){
		testList.push(req.body.atterbergs);
		methodList.push(req.body.atterbergsTestMethod)
	}
	const sample = new sampleModel({
		scheduleNumber: req.body.pickupList,
		sampleDate: req.body.sampleDate,
		sampleType: req.body.sampleType,
		sampleMaterial: req.body.sampleMaterial,
		sampleDescription: req.body.sampleDescription,
		sampleTests: testList,
		sampleTestMethods: methodList
	})
	sample.save((error, newSample) => {
	scheduleModel.findOneAndUpdate({scheduleNumber: req.body.pickupList}, {sampleAssigned: true}).exec()
	res.redirect('/labsamples');})
})





//Start Server
app.listen(3000, () => {
  console.log('server started');
});
