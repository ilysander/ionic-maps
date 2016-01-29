// Ionic Starter App
var nomToken = "imu0gnn79m74o39u53jfrr6klk";
var serviceTrack = "http://192.168.1.36:8080/trackgps/track/simuladorProgramacion?codIdRuta=1&fecProgramacion=20121011&nomToken="+nomToken;
var gpsclient = "http://192.168.1.36:4000";
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'ngCordova','btford.socket-io'])

  .run(function ($ionicPlatform,GoogleMaps) {
    $ionicPlatform.ready(function () {
      if (window.cordova && window.cordova.plugins.Keyboard) {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

        // Don't remove this line unless you know what you are doing. It stops the viewport
        // from snapping when text inputs are focused. Ionic handles this internally for
        // a much nicer keyboard experience.
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }
      
      GoogleMaps.init();
    });
  })

  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('map', {
        url: '/',
        templateUrl: 'templates/map.html',
        controller: 'MapCtrl'
      });
    $urlRouterProvider.otherwise("/");
  })
  .factory('Markers',function ($http) {
    var markers = [];
    
    return{
      getMarkers:function () {
        return $http.get(serviceTrack).then(function (response) {
          console.log('respuesta getMarkers');
          markers = response.data.objRespuesta;
          console.log(response);
          return markers;
        });
      },
      getMarker:function (id) {
        console.log('respuesta getMarker(id)');
      }
    }
  })
  .factory('SocketConection',function (socketFactory) {
    var myIoSocketWeb = io.connect(gpsclient);
    
    mySocket = socketFactory({
      ioSocket:myIoSocketWeb
    });
    
    return myIoSocketWeb;
  })
  .factory('GoogleMaps',function ($cordovaGeolocation,Markers,SocketConection) {
    var apiKey = false;
    var map = null;
    
    function initMap() {
      var options = {timeout:10000,enableHighAccuracy:true};
      
      $cordovaGeolocation.getCurrentPosition(options)
      .then(function (position) {
        var latLng = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
        var mapOptions = {
          center:latLng,
          zoom:15,
          mapTypeId:google.maps.MapTypeId.ROADMAP
        };
        //http://stackoverflow.com/questions/28280738/update-only-markers-in-google-maps
        map = new google.maps.Map(document.getElementById("map"),mapOptions);
        
        //esperamos que carge el map
        google.maps.event.addListenerOnce(map,'idle',function () {
          loadMarkers();
        });
        
      
      },function (error) {
        console.log("no se puede obtener posiciones");
        loadMarkers();
      });
    }
    
    SocketConection.on('track',function (data) {
      console.log(data);
      console.log('socket track');
      var records = data;//.data.result;
        
        for (var i = 0; i < records.length; i++) {
         var record = records[i];
         updateMarker(record);
        }
    });
    
    SocketConection.on('actualizarRemotoTrack',function(data){
			console.log(data);
			SocketConection.emit('track', function(respuesta){
				console.log(respuesta);
         
			});
			// console.log('actualizarRemotoTrack');
		})
    
    var listaMarks = [];
    
    function updateMarker(record) {
      for (var i = 0; i < listaMarks.length; i++) {
         // var record = records[i];
         if (listaMarks[i].codIdDispotivo == record.codIdDispotivo) {
           console.log('actualiza posicion');
           var newLatLng = new google.maps.LatLng(record.nomLatitud,record.numLongitud);
           listaMarks[i].setPosition(newLatLng);
           break;
         }
        }
    }
    function loadMarkers() {
      Markers.getMarkers().then(function (markers) {
        // console.log(markers);
        
        var records = markers;//.data.result;
        
        for (var i = 0; i < records.length; i++) {
         var record = records[i];
         var markerPos = new google.maps.LatLng(record.nomLatitud,record.numLongitud);
         
         //agregar el marker
         var marker = new google.maps.Marker({
           map:map,
           animation: google.maps.Animation.DROP,
           position:markerPos
         });
         marker.codIdDispotivo = record.codIdDispotivo;
         listaMarks.push(marker);
         var infoWindowContent = "<h4>"+record.codIdOperador+"</h4>";
          addInfoWindow(marker,infoWindowContent,record);
        }
      });
    }
    
    function addInfoWindow(marker,message,record) {
      var infoWindow = new google.maps.InfoWindow({
        content:message
      });
      
      google.maps.event.addListener(marker,'click',function () {
        infoWindow.open(map,marker);
      });
    }
    
    return{
      init:function () {
        initMap();
      }
    }
  })
  .controller('MapCtrl', function ($scope, $state, $cordovaGeolocation) {
//     console.log(Markers.getMarkers());
//     var options = { timeout: 10000, enableHighAccuracy: true };
// 
//     $cordovaGeolocation.getCurrentPosition(options).then(function (position) {
//       var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
// 
//       var mapOptions = {
//         center: latLng,
//         zoom: 15,
//         mapTypeId: google.maps.MapTypeId.ROADMAP
//       };
// 
//       $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);
//       
//       google.maps.event.addListenerOnce($scope.map,'idle',function () {
//         var marker = new google.maps.Marker({
//           map:$scope.map,
//           animation:google.maps.Animation.DROP,
//           position:latLng
//         });
//         
//         var infoWindow = new google.maps.InfoWindow({
//           content:"Estoy aqui!"
//         });
//         
//         google.maps.event.addListener(marker,'click',function () {
//           infoWindow.open($scope.map,marker);
//         });
//         
//       });
// 
//     }, function (error) {
//       console.log("No se puede obtener la locacion");
//     });
  });
