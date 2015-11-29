# Carat 2.0

Carat 2.0 is a Software Engineering project with the goal of improving the mobile experience of Carat.

We are using Phonegap to build the User Interface with Javascript, HTML5 and CSS3; multi-platform in mind. Native Java is mainly used for fetching data using Apache Thrift, while making use of pre-existing code snippets.

For more details, visit http://carat.cs.helsinki.fi/ or https://ohtu.tktl.fi/.

# Usage
**Prerequisites**: Node.js, Phonegap/Cordova and Android SDK 21+ (builds for sdk14 and above)    
Install dependencies listed in *package.json* using `npm install` and have browserify available:
```
npm install -g browserify
```
**Build**: Run `npm run build` to created *bundled.js*. Add a platform using:
```
phonegap platform add android
```
**Run**: ```phonegap run android (--verbose)``` or build an apk.

# Documentation
Documentation for javascript files can be generated using jsdoc:
```
npm install -g jsdoc
```
Running `npm run docs` outputs documentation to folder *www/doc*.    
Plugin code similarly has a javadoc available.