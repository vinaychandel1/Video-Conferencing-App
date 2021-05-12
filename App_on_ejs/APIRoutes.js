const express = require('express');
const router = express.Router();
const appController = require('./controllers');



router.post('/join_meeting',appController.join_meeting);
router.post('/host_meeting',appController.host_meeting);
router.get('/Join_meeting:id',appController.join_meeting_link);
router.get('/host_meeting',appController.host_meeting);
router.get('/currentSpeak',appController.current_speak);


module.exports = router;