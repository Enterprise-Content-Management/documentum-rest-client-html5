Documentum REST HTML5 Client Samples
=========

This Java project contains a reference implementation of Documentum REST Services client written in HTML5 + JavaScript code.
The purpose of this project is to demonstrate one way to develop a hypermedia driven REST client to consume Documentum
REST Services. It does NOT indicate that users could not develop a REST client using other technologies.

EMC shares the source code of this project for the technology sharing. If users plan to migrate the sample code to their
 products, they are responsible to maintain this part of the code in their products and should agree with license polices
  of the referenced libraries used by this sample project.

### How To Use
1. Place the project files in Tomcat's *webapps/examples* folder or just put it anywhere else and adjust Tomcat's
*server.xml* file , inside the <Host> element:
>      <Context path="/restapp" docBase="/opt/home/dctm/HTML5/CoreRestApp/app" />
2. Save it (if you edited server.xml) and bounce Tomcat.
3. You now should be able to access this app by entering the following into the browser's URI field **http://demo-server:8080/restapp**.
4. If all goes well, you now should be prompted by the pop up dialog to enter Home Services URI
(ie. http://demo-server:8080/dctm-rest/services.json) and user credentials - and hit OK.
5. Again - if all goes well, you'll see progress feedback and then UI should be repainted with selection of Repositories
exposed to the REST services.