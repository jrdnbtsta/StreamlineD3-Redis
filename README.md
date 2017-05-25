# StreamlineD3-Redis
Providing developers with a simple way to create live updating visualizations for their streaming data.

## Features
  * Customize colors, fonts, heights, widths, and more.å
  * A diffing algorithm renders only the data that changes for blazing fast performance.
  * Load balancing through Node clusters lets your app scale to multiple streams and visualizations.
  * Pre-built, ready to use visualizations including: Bar, Line, Scatter, Pie, Bubble, Word-Cloud, and World Map.
  
## Getting Started

1. ```npm install --save streamlined3-redis```
2. create an index.js file
3. create an index.html file
  
### Index.js

NOTE: because our library uses load balancing through Node clusters on the back end to support scaling and optimal performance, it is important for you to NOT make a traditional server using Node or Express.  The functionality for an Express server is already set up for you and no worries, you can still customize it. Follow the instructions below for more info. 
     
1. In your index.js file require our library:
```
const streamline = require('streamlined3');
```
2. Create a new instance, passing a callback and a port#:<br/>
```
let myStream = new streamline(sendFiles, port#);
```

note: please choose any port other than 6379 (as our Redis server will be running on this port)

3. Put all the code/routes/etc. you would normally want in your server file inside this function:
```
function sendFiles(app) {
  app.use(express.static(path.join(__dirname, 'client')));

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/home-page.html'));
  });
}
```

4. Create an array ```let myData = []``` to hold your data.  Call your API to get streaming data and push the results into your myData array.  FYI, it is a good idea to buffer this data to not overload your system.  

5. Look at your API data key/value pairs and find the data values that you want to visualize in your graph.  Put them inside a config object. (see Specific Configuration Settings for... below for what type of key/value pairs you'll need for each visualization):
```
let config = {
  width: 500,
  height: 500,
  xdomain: 10,
  ydomain: 10,
  xticks: 10,
  yticks: 10,
  xScale: post
  yScale: number-of-likes
  xLabel: 'the name of the post',
  yLabel: 'how many likes someone got'
};
```
6. Invoke the StreamlineD3 ```connect``` method on the new instance you created in step 2.  For names of methods you can call, see Specific Configuration Settings for... below for each type of visualization. <br/>
```
myStream.connect((socket) => {
  myStream.line(socket, myData, config);
});
```

### Install Redis and Start Your Servers

Because sockets and Node clusters don't work well togther without additional measures taken, you must install Redis and start a Redis server. The easiest way is through HomeBrew.  Download Homebrew https://brew.sh/ and then in the terminal ```$ brew install redis```.  Once Redis is installed ```$redis-server``` to start a Redis server.  Lastly, type ```$ node index.js``` or whatever you named your js file to start the initial Node server we set up for you in our library.  Note: all these steps assume you are using a mac.  If you're using windows, these Bash commands will not work.  

### HTML
      
1. Choose a graph from the graph folder in this repo and add it to a script tag.
```
<script src="line.js"></script>
```
  OR...you can use the CDN for any graph other than the world map and/or world-cloud
```
   <script src="http://cdn.jsdelivr.net/gh/StreamlineD3/SD3-Demo@1.4/client/graphs/bundle.min.js"></script>
```
2. Add the necessary dependency libraries (you must use version 4+ of d3 otherwise you will encounter errors):
```
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/4.8.0/d3.min.js"></script>
<script src="graphs/d3-scale-chromatic.min.js"></script>
<script src="/socket.io/socket.io.js"></script>
```

3. Add a ```<div>``` node with an id of ```(see Specific Configuration Settings for... below for what each visualization is called)``` where you want your visualization to appear:
```<div id="Name-Of-Visualization"></div>```
      
And voilà! You now have a working, live-updating visualization.


## Specific Configuration Settings for the Bar Graph

  1. Method <br/>
   ```
   myStream.connect((socket) => {
     myStream.bar(socket, barData, barConfig);
   });
  ```
  2. Config File
   ```
   let barConfig = {
     setWidth: 800,
     setHeight: 400,
     shiftYAxis: true,
     xDomainUpper: 20,
     xDomainLower: 0,
     yDomainUpper: 50,
     yDomainLower: 0,
     xTicks: 10,
     yTicks: 50,
     xScale: 'Borough',
     volume: 'Speed',
     yLabel_text: 'Miles Per Hour',
     label_text_size: 20,
     transition_speed: 1000,
     color: ['#DAF7A6', '#FFC300', '#FF5733', '#C70039', '#900C3F', '#581845'],
   };
   ```
  3. Html
   ```
    <div id="bar-graph"></div>
   ```

## Specific Configuration Settings for the Line Graph

  1. Method <br/>
```
   myStream.connect((socket) => {
     myStream.line(socket, lineData, lineConfig);
   });
```
  2. Config File
   ```
   let lineConfig = {
     setWidth: 600,
     setHeight: 400,
     shiftXAxis: true,
     xDomainUpper: 50,
     xDomainLower: 0,
     yDomainUpper: 40,
     yDomainLower: 0,
     xTicks: 10,
     yTicks: 10,
     xScale: 'counter',
     yScale: 'num_bikes_available',
     xLabel_text: 'at the currently reporting station',
     yLabel_text: 'number of available bikes'
   };
   ```
 3. Html
  ```
   <div id="line-chart"></div>
  ```

## Specific Configuration Settings for the Bubble Graph

  1. Method <br/>
 ```
   myStream.connect((socket) => {
     myStream.bubbleGraph(socket, bubbleData, bubbleConfig);
   });
 ```
  2. Config File
   ```
   let bubbleConfig = {
     setWidth: 600,
     setHeight: 400,
     text: 'station_id',
     volume: 'num_bikes_available',
   };
   ```
 3. Html
  ```
   <div id="bubble-graph"></div>
  ```

## Specific Configuration Settings for the Pie Chart

  1. Method <br/>
```
    myStream.connect((socket) => {
      myStream.pie(socket, pieData, pieConfig);
    });
 ```
  2. Config File
   ```
    let pieConfig = {
      setWidth: 400,                   
      setHeight: 400,                  
      category: 'genre',//category to be show in pie slices
      count: 'count'
    };
   ```
 3. Html
  ```
   <div id="pie-chart"></div>
  ```

## Specific Configuration Settings for the Scatter

  1. Method <br/>
 ```
    myStream.connect((socket) => {
      myStream.scatter(socket, scatterData, scatterConfig);
    });
```
  2. Config File
   ```
    let scatterConfig = {
      setWidth: 600,
      setHeight: 400,
      //axis
      xDomainUpper: 1500,
      xDomainLower: 0,
      yDomainUpper: 20000,
      yDomainLower: 0,
      xTicks: 10,
      yTicks: 10,
      xLabel_text: 'Number of Followers',
      yLabel_text: 'Number of Tweets',
      label_font_size: 20,
      xScale: 'followers_count',
      yScale: 'statuses_count',
      volume: 'favourites_count',
      circle_text: '',
      transition_speed: 5000,
    };
   ```
 3. Html
  ```
   <div id="scatter-plot"></div>
  ```
## Specific Configuration Settings for the World Map

  1. Method <br/>
 ```
    myStream.connect((socket) => {
      myStream.map(socket, scatterData, scatterConfig);
    });
```
  2. Config File
   ```
   let mapConfig = {
     setWidth: 1300,
     setHeight: 800,
     latitude: 'latitude',
     longitude: 'longitude',
     mapItem: 'satellite', //the thing being mapped
     propTwo: '',
     color:'#B0C4DE'
   };
   ```
 3. Html
  ```
   <div id="map"></div>
  ```
  4. Add this script tag:
  ```
   <script src="https://unpkg.com/topojson-client@3"></script>
  ```
