'use strict'; 
require('dotenv').config();
var request = require('request');
const querystring = require('querystring');
const https = require('https');
const { Console } = require('console');

var ticketTufin = {
    find: (req,res) => {
        createTicket(req)
        .then(data=>{
            console.log("response ondina: ",data);
            res.send(data);
        })
        .catch(error =>{
            console.log("error: ",error);
            res.send({
                error: error
            });
        })
    }
}

async function createTicket(JSONdatastring){
    var JSONdata;
    if(process.env.NODE_ENV === 'production') {
        // We are running in production mode
        JSONdata= JSONdatastring
    } else {
        // We are running in development mode
        JSONdata= JSON.parse(JSONdatastring)
    }
    /*formato de variable JSONdata
    var JSONdata={
        subject: string,
        requester: string,
        priority: string,
        groupName: string,
        IPlista: array[],
        uname:uname,
        psw:psw
        comments: comments
        arrayIPCountry: array[]
    }*/
    let arrayIPCountry = JSONdata.arrayIPCountry
    consumeTufinAPI(JSONdata,arrayIPCountry)
        .then(data=>{
            console.log("response api tufin: ",data);
            
        })
        .catch(error =>{
            console.log("error api tufin: ",error)
        })
}

async function consumeTufinAPI(requestJSON,arrayIPCountry){
    var IDcaso = "";
    var data=process.env.PLANTILLA_TICKET_TUFIN;
    data=data.replace('\&',requestJSON.subject);
    data=data.replace('\&',requestJSON.requester);
    data=data.replace('\&',requestJSON.priority);
    data=data.replace('\&',requestJSON.groupName);
    
    /////
    //requestJSON.subject= "Solicitud de Informacion_599634_cjumbos_prueba_20220729_6"
    //numbersofSubject= [599634, 20220729, 6]
    var numbersofSubject=requestJSON.subject.match(/(?<=_)\d+/g).map(function (v) {return +v;});
    IDcaso=numbersofSubject[0];
    for (let i in numbersofSubject){
        //console.log(i+" "+numbersofSubject[i])
        if (i==2){
            IDcaso= IDcaso+"_"+numbersofSubject[2];
        }
    }
    var memberofGroupTufin = "";
    arrayIPCountry.forEach((element,i) => {
        i++;
        let country=element.country.replace(/\s/g, '_')
        memberofGroupTufin += 
        `{
            "@type": "HOST",
            "object_type": "Host",
            "status": "ADDED",
            "object_updated_status": "NEW",
            `
            +`"name": "`+country+`_`+i+`_`+IDcaso+`",
            "comment": "`+ country+`_`+i+`_`+IDcaso+`",
            "object_UID": "`+ element.ip+`",
            "object_details": "`+ element.ip+`/255.255.255.255"
        },`;
    });
    memberofGroupTufin=memberofGroupTufin.slice(0, -1);//elimina la ultima ','
    data=data.replace('\&',memberofGroupTufin);
    data=data.replace('\&',requestJSON.comments);
    console.log(data);
    let jsonTufinRequest = JSON.parse(data);
    var auth = 'Basic ' + Buffer.from(requestJSON.uname + ':' + requestJSON.psw).toString('base64');
    return await fetch(process.env.URL_API_TUFIN_TICKETS,{
      method: "POST",
      body: JSON.stringify(jsonTufinRequest),
      headers: {
          'Authorization': auth,
          "Content-Type": "application/json",
          'Accept': 'application/json, text/plain, */*'
      }
    })
}

module.exports = ticketTufin;
