const randomstring = require("randomstring");

let port =process.env.PORT ;
if (port == null ||port =="undefined"||port == "") {
    port ="http://localhost:"+3000;
}
else{
    port="https://"+port;
}


exports.host_meeting=(req,res)=>{
    var meetingID  = randomstring.generate({
        length:9,
        charset:'numeric'
      });
      var password  = randomstring.generate({
        length:9,
        charset:'alphabetic'
      }); 
    var host_user=([{
        userName:req.body.name,
        meetingId:meetingID,
        port:port
    }])
    res.render('host_meeting',{body:host_user});
}


exports.join_meeting=(req,res)=>{
    var join_user=([{
        userName:req.body.name,
        meetingId:req.body.meetingID,
        
        }])
        console.log(join_user)
    res.render('join_meeting',{body:join_user});
}

exports.join_meeting_link=(req,res)=>{
    console.log(req.params)
    var join_user=([{
        userName:req.body.name,
        meetingId:req.params.id,
        port:port
        }])
        console.log(join_user)
    res.render('join_meeting',{body:join_user});   
}

exports.current_speak=(req,res)=>{
    res.render('currentSpeaking');
}

