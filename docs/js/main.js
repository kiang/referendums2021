var sidebar = new ol.control.Sidebar({ element: 'sidebar', position: 'right' });
var jsonFiles, filesLength, fileKey = 0;

var projection = ol.proj.get('EPSG:3857');
var projectionExtent = projection.getExtent();
var size = ol.extent.getWidth(projectionExtent) / 256;
var resolutions = new Array(20);
var matrixIds = new Array(20);
for (var z = 0; z < 20; ++z) {
  // generate resolutions and matrixIds arrays for this WMTS
  resolutions[z] = size / Math.pow(2, z);
  matrixIds[z] = z;
}

var sidebarTitle = document.getElementById('sidebarTitle');
var content = document.getElementById('sidebarContent');
var cityMeta = {};

var appView = new ol.View({
  center: ol.proj.fromLonLat([120.221507, 23.000694]),
  zoom: 14
});

var attribution = new ol.control.Attribution({
  collapsible: false,
  collapsed: true
});

var vote = {};
$.getJSON('data.json', {}, function (c) {
  vote = c;
  cunli.getSource().refresh();
});

var baseLayer = new ol.layer.Tile({
  source: new ol.source.WMTS({
    matrixSet: 'EPSG:3857',
    format: 'image/png',
    url: 'https://wmts.nlsc.gov.tw/wmts',
    layer: 'EMAP',
    tileGrid: new ol.tilegrid.WMTS({
      origin: ol.extent.getTopLeft(projectionExtent),
      resolutions: resolutions,
      matrixIds: matrixIds
    }),
    style: 'default',
    wrapX: true,
    attributions: '<a href="http://maps.nlsc.gov.tw/" target="_blank">國土測繪圖資服務雲</a>'
  }),
  opacity: 0.8
});

var cunli = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'https://kiang.github.io/taiwan_basecode/cunli/topo/20210324.json',
    format: new ol.format.TopoJSON({
      featureProjection: appView.getProjection()
    })
  }),
  style: cunliStyle
});

var map = new ol.Map({
  layers: [baseLayer, cunli],
  target: 'map',
  view: appView,
  controls: ol.control.defaults({ attribution: false }).extend([attribution])
});

map.addControl(sidebar);
var pointClicked = false;
var townPool = {};
map.on('singleclick', function (evt) {
  pointClicked = false;
  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    if (false === pointClicked) {
      firstPosDone = true;
      currentFeature = feature;
      if (lastFeature) {
        lastFeature.setStyle(cunliStyle);
      }
      var p = feature.getProperties();
      var message = '';
      if (vote[p.VILLCODE]) {
        message += '<table class="table table-dark"><tbody>';
        message += '<tr><th scope="row">可投票人口</th><td>' + vote[p.VILLCODE].votable_population + '</td></tr>';
        message += '<tr><th scope="row">重啟核四</th><td>同意：' + vote[p.VILLCODE]['17_agree'] + ' / 不同意：' + vote[p.VILLCODE]['17_disagree'] + '</td></tr>';
        message += '<tr><th scope="row">反萊豬</th><td>同意：' + vote[p.VILLCODE]['18_agree'] + ' / 不同意：' + vote[p.VILLCODE]['18_disagree'] + '</td></tr>';
        message += '<tr><th scope="row">公投綁大選</th><td>同意：' + vote[p.VILLCODE]['19_agree'] + ' / 不同意：' + vote[p.VILLCODE]['19_disagree'] + '</td></tr>';
        message += '<tr><th scope="row">珍愛藻礁</th><td>同意：' + vote[p.VILLCODE]['20_agree'] + ' / 不同意：' + vote[p.VILLCODE]['20_disagree'] + '</td></tr>';
        message += '</tbody></table>';
        sidebarTitle.innerHTML = p.COUNTYNAME + p.TOWNNAME + p.VILLNAME;
        currentFeature.setStyle(cunliStyle);
      }

      lastFeature = currentFeature;
      content.innerHTML = message;
      sidebar.open('home');
      pointClicked = true;
    }
  });
});

var colorMode = 'full';
$('a.btn-mode').click(function (e) {
  e.preventDefault();
  colorMode = $(this).attr('data-mode');
  $('a.btn-mode').each(function () {
    if (colorMode === $(this).attr('data-mode')) {
      $(this).removeClass('btn-secondary').addClass('btn-primary');
    } else {
      $(this).removeClass('btn-primary').addClass('btn-secondary');
    }
  });
  cunli.getSource().refresh();
});
function cunliStyle(f) {
  var p = f.getProperties();
  var color = 'rgba(255,255,255,0.3)';
  var strokeWidth = 1;
  var strokeColor = 'rgba(0,0,0,0.3)';
  if (f === currentFeature) {
    strokeColor = 'rgba(255,0,0,1)';
    strokeWidth = 5;
  }
  if (vote[p.VILLCODE]) {
    switch (colorMode) {
      case 'full':
        if (vote[p.VILLCODE]['17_agree'] > vote[p.VILLCODE]['17_disagree']
          && vote[p.VILLCODE]['18_agree'] > vote[p.VILLCODE]['18_disagree']
          && vote[p.VILLCODE]['19_agree'] > vote[p.VILLCODE]['19_disagree']
          && vote[p.VILLCODE]['20_agree'] > vote[p.VILLCODE]['20_disagree']) {
          color = 'rgba(0,0,255,0.3)'; //blue
        }
        if (vote[p.VILLCODE]['17_agree'] < vote[p.VILLCODE]['17_disagree']
          && vote[p.VILLCODE]['18_agree'] < vote[p.VILLCODE]['18_disagree']
          && vote[p.VILLCODE]['19_agree'] < vote[p.VILLCODE]['19_disagree']
          && vote[p.VILLCODE]['20_agree'] < vote[p.VILLCODE]['20_disagree']) {
          color = 'rgba(27,148,49,0.3)'; //green
        }
        break;
      case '17':
        if(vote[p.VILLCODE]['17_agree'] > vote[p.VILLCODE]['17_disagree']) {
          color = 'rgba(0,0,255,0.3)'; //blue
        } else {
          color = 'rgba(27,148,49,0.3)'; //green
        }
        break;
      case '18':
        if(vote[p.VILLCODE]['18_agree'] > vote[p.VILLCODE]['18_disagree']) {
          color = 'rgba(0,0,255,0.3)'; //blue
        } else {
          color = 'rgba(27,148,49,0.3)'; //green
        }
        break;
      case '19':
        if(vote[p.VILLCODE]['19_agree'] > vote[p.VILLCODE]['19_disagree']) {
          color = 'rgba(0,0,255,0.3)'; //blue
        } else {
          color = 'rgba(27,148,49,0.3)'; //green
        }
        break;
      case '20':
        if(vote[p.VILLCODE]['20_agree'] > vote[p.VILLCODE]['20_disagree']) {
          color = 'rgba(0,0,255,0.3)'; //blue
        } else {
          color = 'rgba(27,148,49,0.3)'; //green
        }
        break;
    }
  }
  var textColor = '#000000';

  var baseStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: strokeColor,
      width: strokeWidth
    }),
    fill: new ol.style.Fill({
      color: color
    }),
    text: new ol.style.Text({
      font: '14px "Open Sans", "Arial Unicode MS", "sans-serif"',
      fill: new ol.style.Fill({
        color: textColor
      })
    })
  });

  baseStyle.getText().setText(p.TOWNNAME + p.VILLNAME);
  return baseStyle;
}

var currentFeature = false;
var lastFeature = false;

var geolocation = new ol.Geolocation({
  projection: appView.getProjection()
});

geolocation.setTracking(true);

geolocation.on('error', function (error) {
  console.log(error.message);
});

var positionFeature = new ol.Feature();

positionFeature.setStyle(new ol.style.Style({
  image: new ol.style.Circle({
    radius: 6,
    fill: new ol.style.Fill({
      color: '#3399CC'
    }),
    stroke: new ol.style.Stroke({
      color: '#fff',
      width: 2
    })
  })
}));

var firstPosDone = false;
geolocation.on('change:position', function () {
  var coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
  if (false === firstPosDone) {
    appView.setCenter(coordinates);
    firstPosDone = true;
  }
});

new ol.layer.Vector({
  map: map,
  source: new ol.source.Vector({
    features: [positionFeature]
  })
});

$('#btn-geolocation').click(function () {
  var coordinates = geolocation.getPosition();
  if (coordinates) {
    appView.setCenter(coordinates);
  } else {
    alert('目前使用的設備無法提供地理資訊');
  }
  return false;
});