'use strict'; 
var properties = require('../package.json') 
var callAPIpais = require('../service/paises.js'); 
var ticketTufin = require('../service/ticketTufin.js'); 
var controller = { 
    about: function(req,res){ 
        var aboutInfo = { 
            name:properties.name, 
            version: properties.version,
            author:properties.author
        } 
        res.json(aboutInfo); 
    },
    callAPIpaises:function(req, res){
        callAPIpais.find(req.body, res);
    },
    createTufinTicket:function(req, res){
        ticketTufin.find(req.body, res);
    },
};
module.exports = controller;