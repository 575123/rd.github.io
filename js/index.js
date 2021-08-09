window.VehiclesShow = true;
window.jls = false;
window.vjd = true;
window.dx = 0;
window.map = Math.floor(Math.random() * 3);
window.mapid = 0;
window._R = 0;
window.z0 = 0;
window.fight = 0;
window.showIcon = true;
window.znz = 1;
window.drawLongLine = 1;
window.num_display_mod = 1;
window.white_r = 100000;
window.showLevel2 = 1;
var apiURL_L = "";
var apiURL_R = "";
var isLocal = false;
var isLocal_last = false;
var serverQueryURL = "";
var maps;
var isEnemaryIn10m = false;
var isEnemaryIn10m_curr_loop = false;
isShowKill = true;
var isInFinal = false;
var isNearFinal = false;
var locations = {};
var player0 = {
	x: 0,
	y: 0,
	z: 0,
	r: 0
};
var trackPlayerIndex = 0;
var force_rotate = false;
var force_rotate_not_set = true;
var aim_part = 0;
var aim_part_text = "";
var apiURL_L_find = "";
var cc;
var ba = 0;
var team_member_show_lines = 0;
var a_ips;
var _port = "";
var zone;
var dis_nearest_enmary = 1000;
var dis_farest_enamary = 1;
var is_in_custom_scale = false;
var is_in_dis_300_scale = false;
var is_auto_zoom = false;
var is_in_custom_zoom = false;
var last_zoom_status = -1;
var is_enamary_100_300 = false;
var BA;
var isInAir = false;
var isP0InVech = false;
var zooming = false;
var isShared = false;
var isShowPlayerName = false;
var isShowAllPlayerName = false;
var isShowDangerPlayerName = true;

var veh = {
	"101": 'Boat',
	"102": 'AquaRail',
	"103": 'Motor',
	"104": 'Motor',
	"105": 'Motor',
	"106": 'Motor',
	"107": 'Buggy',
	"108": 'Jeep',
	"109": 'Motor',
	"110": 'Motor',
	"111": 'Jeep',
	"112": 'Dacia',
	"113": 'Mirado',
	"114": 'Truck',
	"115": 'Truck',
	"116": 'Bus',
	"117": 'Tank'
};

$(function () {
	window.addEventListener('resize', onResize);
	onResize();

	document.ontouchmove = function (event) {
		event.preventDefault();
	}
	radar = new Radar($('#radar')[0]);
	BA = new ba();
})

var ZoomOut;
var ZoomIn;
var SwitchRotate;
var ZoomOut;
var ZoomIn;
var SwitchRotate;
var lastZoom = 0;
var currZoom = 0;
var is_init = true;
var refInterval = null;

$(function () {
	init();
});

function init() {

	//$('#id_autoZoom').bootstrapSwitch('setState', false);
	//cc = (Utils.getParameterByName('c')).toUpperCase() || '0';
	//isShowAllPlayerName = Utils.getParameterByNam("a") == "1";
	var url = document.location.href;
	var aURL = url.split('/');
	cc = aURL[aURL.length - 1];
	cc = cc.replace('#', '');
	_port = cc;

	//if (cc == '1698')
	//	isShowAllPlayerName = true;
		//team_member_show_lines = 1;

	var isMobClient = false;
	if (ismob()) {
		isMobClient = true;
		radar.setZoom(0.4);
		radar.setScale(0.4);
	}

	//var rndCode = '8888';
	var refreshIntervel = 100;
	setU();
	setM();

	ZoomOut = function ZoomOut() {
		radar.setZoom(Math.pow(1.1, 2));
		redraw();
	};

	ZoomIn = function ZoomIn() {
		radar.setZoom(Math.pow(1.1, -2));
		redraw();
	}

	SwitchRotate = function SwitchRotate() {
		var r = !(radar.getIsRotate());
		radar.setIsRotate(r);
		redraw();
	}

	getU(1155);

	function startRefInterval() {
		if (!refInterval)
			refInterval = setInterval(function () {
				getJson();
				redraw();
			}, refreshIntervel);
	}

	function reStartRefInterval() {
		if (refInterval) {
			clearInterval(refInterval);
			refInterval = null;
		}
		startRefInterval();
	}


	var max_local_retrieve_json_times = 100;
	var local_retrieve_json_times = 0;

	var local_ip_address_try_time = 0;

	function get_posuble_l_ip() {
		local_ip_address_try_time++;
		if (local_ip_address_try_time > 3) {
			return;
		}

		if (a_ips == undefined || a_ips == "") {
			getAllIps();
		}

		if (_port != "" && apiURL_L_find == "" && a_ips != undefined) {
			for (var i = 0; i < a_ips.length; i++) {
				var this_ip = a_ips[i];
				//var this_url = "http://103.146.230.158:36618/api/9003";
				//var this_url = "http://" + this_ip + ":" + _port + "/api/" + cc;

				new ping(this_url, function (status, ip, e) {
					if (status == "responded") {
						apiURL_L = ip;
						apiURL_L_find = ip;
						console.log(apiURL_L);
						isLocal = true;
						postU(iClientT, cc);
					}
				});
			}

		}
	}

	setInterval(function () {
		get_posuble_l_ip();
	}, 1000);


	function getLocalJson() {
		if (apiURL_L == "") {
			isLocal = false;
		} else {
			if (local_ip_address_try_time <= 3) {
				$.get(apiURL_L,
					function (data) {
						isLocal = data != "";
					});
			}
		}

		if (isLocal != isLocal_last) {
			refreshIntervel = isLocal ? 15 : 100;
			reStartRefInterval();
		}

		isLocal_last = isLocal;
	}

	getLocalJson();
	setInterval(function () {
		getLocalJson();
	}, 2000);

	getJson();
	startRefInterval();
	getUInterval(1155);

	var iClientT = isMobClient ? "1" : "0";
	postU(iClientT, cc);

	window.setInterval(changeMap, 1000);

	setInterval(function () {
		if (lastZoom != currZoom && is_init == false) {
			if (currZoom > lastZoom) {
				ZoomOut();
			}
			if (currZoom < lastZoom) {
				ZoomIn();
			}
			lastZoom = currZoom;
		}
	}, 500);

	setInterval(function () {
		if(isShared){
			postS(cc);
		}
		/*lastScale = 0;
		if (locations.p) {
			BA.setdata(locations, window.innerHeight);
			BA.scaleFactor = radar.scaledFactor;
			//if (!zooming)
				auto_zoom();
		}*/
	}, 30000);


	map = -1;

	// 手势支持
	var hammertime = new Hammer.Manager($('.container2')[0]);
	hammertime.add(new Hammer.Pan({
		threshold: 0
	}));
	hammertime.add(new Hammer.Pinch({
		threshold: 0
	}));

	// 拖动
	var lastDelta = {
		x: 0,
		y: 0
	}
	hammertime.on('panmove', function (ev) {
		radar.setMove(ev.deltaX - lastDelta.x, ev.deltaY - lastDelta.y);
		lastDelta.x = ev.deltaX;
		lastDelta.y = ev.deltaY;
		redraw();
	});
	hammertime.on('panend', function (ev) {
		lastDelta = {
			x: 0,
			y: 0
		}
	});


	function getJson() {
		if (local_retrieve_json_times >= max_local_retrieve_json_times)
			isLocal = false;

		if (isLocal) {
			$.get(apiURL_L,
				function (data) {
					if (data != undefined && data != "")
						try {
							locations = $.parseJSON(data);
						} catch (error) {
							local_retrieve_json_times++;
						}
				});
		} else {
			$.getJSON(apiURL_R,
				function (data) {
					if (data != undefined && data != "")
						locations = data;
				});
		}

	}

	// 缩放
	var lastScale = 0;
	hammertime.on('pinchmove', function (ev) {
		var size = 0.6;
		if (lastScale > ev.scale) {
			size = -size;
		}
		radar.setZoom(Math.pow(1.1, size));
		lastScale = ev.scale;
		redraw();
	});
	hammertime.on('pinchend', function () {
		lastScale = 0;
	});

	// 鼠标滚轮缩放
	$('.container2').on("mousewheel DOMMouseScroll", function (e) {
		var evt = e.originalEvent;
		var delta = evt.wheelDelta ? evt.wheelDelta / 100 : evt.detail ? -evt.detail : 0;
		if (delta) {
			radar.setZoom(Math.pow(1.1, delta));
			redraw();
		}
		return evt.preventDefault() && false;
	});



	$(document).keydown(function (e) {
		switch (e.which) {
			case 81:
				radar.setZoom(Math.pow(1.1, -5));
				redraw();
				break;
			case 69:
				radar.setZoom(Math.pow(1.1, 5));
				redraw();
				break;
			case 113:
				if (vjd == false) {
					vjd = true;
				} else {
					vjd = false;
				}
				redraw();
				break;
			case 114:
				if (VehiclesShow == false) {
					VehiclesShow = true;
				} else {
					VehiclesShow = false;
				}
				redraw();
				break;

			case 220:
				window.location.reload();
				break;
			case 33:
				trackPlayerIndex = trackPlayerIndex + 1
				redraw();
				break;
			case 34:
				trackPlayerIndex = trackPlayerIndex - 1
				if (trackPlayerIndex < 0) {
					trackPlayerIndex = 0
				}
				redraw();
				break;
		}
	});
}