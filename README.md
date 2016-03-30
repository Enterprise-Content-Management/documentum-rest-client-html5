Documentum REST HTML5 Client Samples
=========

This project contains a reference implementation of Documentum REST Services client written in HTML5 + JavaScript code.
The purpose of this project is to demonstrate one way to develop a hypermedia driven REST client to consume Documentum
REST Services. It does NOT indicate that users could not develop a REST client using other technologies.

EMC shares the source code of this project for the technology sharing. If users plan to migrate the sample code to their
products, they are responsible to maintain this part of the code in their products and should agree with license polices
of the referenced libraries used by this sample project.
  
## Overview
This Documentum REST Services client is written with HTML5 + JavaScript. Underlying it leverages AngularJS and Bootstrap 
to communicate with Rest server and render the UI. 

## Environment Preparation
1. Java 6 or later is installed for REST Services. 
2. Documentum REST Services 7.2 is deployed in the development environment.
3. Tomcat 7.0 as runtime enviroment for the client.
3. FireFox, Chrome, IE are all supported. FireFox is recommended.

## How To Use
1. Download the project files in your development environment 
2. Adjust Tomcat's *{tomcat_home}/server.xml* file , adding a <context> inside the <Host> element, :
>      <Context path="/restapp" docBase="{source code root}/app" />
2. Bounce Tomcat.
3. You now should be able to access this app by entering the following into the browser's URI field **http://demo-server:8080/restapp.
4. If all goes well, you now should be prompted by the pop up dialog to enter Home Services URI
(ie. http://demo-server:8080/dctm-rest/services.json) and user credentials - and hit OK.
5. Again - if all goes well, you'll see progress feedback and then UI should be repainted with selection of Repositories
exposed to the REST services.

## Known Issues
1. The resources of search, dql, batches is temporary not supported.