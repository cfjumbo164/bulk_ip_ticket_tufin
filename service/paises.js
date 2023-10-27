'use strict'; 
require('dotenv').config();
var request = require('request');
const querystring = require('querystring');
const https = require('https');
const { Console } = require('console');

var callAPIpais = {
    find: (req,res) => {
        let requestJSON;
        if(process.env.NODE_ENV === 'production') {
            // We are running in production mode
            requestJSON=req;
        } else {
            // We are running in development mode
            requestJSON=JSON.parse(req)
        }
        
		checkCredentialsTufin(requestJSON)
		.then(data=>{
			let tmp = data.headers.get("www-authenticate")
			console.log("response AUTH: ",tmp);
			if (tmp ==null){
				tmp='Error: '+data.status
			}
			let error={
				"codError":data.status,
				"mensaje": tmp
			}
			//console.log("zacatela", data)
			if (data.status==400){//login exitoso con credenciales
				callFraudGuard(req)
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
			}else{
				res.send(error);//Muestra mensaje de logon fallido por credenciales erroneas
			}
		})
		.catch(error =>{
            console.log("error: ",error);
            res.send({
                error: error
            });
        })
    }
}
function checkCredentialsTufin(requestJSON){
	var auth = 'Basic ' + Buffer.from(requestJSON.uname + ':' + requestJSON.psw).toString('base64');
	return fetch(process.env.URL_API_TUFIN_CREDENTIALS,{
      method: "POST",
      headers: {
          'Authorization': auth,
          "Content-Type": "application/json",
          'Accept': 'application/json, text/plain, */*'
      }
    })
}
async function callFraudGuard(JSONdataRequest){
    var JSONdata
    if(process.env.NODE_ENV === 'production') {
        // We are running in production mode
        JSONdata= JSONdataRequest
    } else {
        // We are running in development mode
        JSONdata= JSON.parse(JSONdataRequest)
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
    }
    */
    //data: parametro string que recibe API FraudGuard.io
    //data = '["1.20.97.181", "82.25.3.7"]'; //ejemplo
    var data = "[";
    for (let i in JSONdata.IPlista){
        data = data + '"' + JSONdata.IPlista[i] + '"';
        if (i < JSONdata.IPlista.length-1){
            data = data + ","
        }else{
            data = data + "]"
        }
    }    
    var appID = '';
    var apiKey = '';
    var bandera = true;
    //Read File properties about MSI members
	if(process.env.NODE_ENV === 'production') {
        // We are running in production mode
        var usernameProperties = JSON.parse(process.env.USERNAME_PROPERTIES);
        usernameProperties.members.member.forEach(element =>
            {
                if (element.username==JSONdata.requester){
                    bandera=false;
                    JSONdata.requester = element.requester;//cambiar usuario de red a usuario de tufin
                }
            })
        appID=process.env.APP_ID_FRAUDGUARD
        apiKey=process.env.API_KEY_FRAUDGUARD
        
    } else {
        // We are running in development mode
        try {
            var fs = require('fs'); 
		    var usernameProperties = JSON.parse(fs.readFileSync('/microservice/apikeys.json', 'utf8'));
        } catch (err) {
            console.error(err);
        }
        usernameProperties.members.member.forEach(element =>
            {
                if (element.username==JSONdata.requester){
                    bandera=false;
                    JSONdata.requester = element.requester;//cambiar usuario de red a usuario de tufin
                    element.apikeys.forEach (apikey => {
                        if (apikey.apiname == "FraudGuard"){
                            appID = apikey.username
                            apiKey = apikey.password
                        }
                    })
                }
            })
    }

    if (bandera){
		console.log("No existe usuario en Tufin")
		let error={
			"codError":"1",
			"mensaje": "No existe usuario en Tufin"
		}
        return error
    }	

    //This API endpoint allows you to search the FraudGuard.io attack correlation engine with up to 1024 IPs or a CIDR block of /22 or smaller.
    var auth = 'Basic ' + Buffer.from(appID + ':' + apiKey).toString('base64');
    var body='';
    var options = {
    hostname: "rest.fraudguard.io",
    port: 443,
    path: '/api/bulk_lookup',
    method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth,
            'Content-Length': data.length
        }
    };
    return new Promise((resolve, reject)=>{
    var req = https.request(options, (res) => {
        res.on('data', (d) => {
            body += d;
        });
        res.on('end', function () {
            try{
            var bodyArrayTmp=JSON.parse(body);
            }catch (err){
                let error={
                    "codError":"1",
                    "mensaje": body
                }
                resolve(error);
                console.log("porpor", error)
                return 
            }
            //crea un array de JSON object [{ip:'',country:''},...]
            var bodyArray = bodyArrayTmp.map( function(element) {
                var info = { 
                            "ip": element.ip,
                            "country": element.country
                            }
                return info;
            });
            resolve(bodyArray);
        });
    });         
    req.on('error', (e) => {
        console.error(e);
        reject(e)
    });
    req.write(data);
    req.end()})

}

module.exports = callAPIpais;
