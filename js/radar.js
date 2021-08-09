window.angleInDegrees2 = 0;
window.endPt;
function Radar(canvas) {
	this.isRotate = false;
	this.canvas = canvas;
	this.ctx = canvas.getContext('2d');
	trackTransforms(this.ctx);
	this.zone;
	this.lastBlueZone;
	this.lastWhiteZone;
	this.scaledFactor = 1;
	this.scale = 1;
	this.mapImage = new Image;
	this.focusOffset = {
		X: this.canvas.width / 2,
		Y: this.canvas.height / 2
	};
	this.viewPortOffset = {
		X: 0,
		Y: 0
	};
	var self = this;
	window.addEventListener('resize', function () {
		self.focusOffset = {
			X: self.canvas.width / 2,
			Y: self.canvas.height / 2
		};
	});

	// Adds ctx.getTransform() - returns an SVGMatrix
	// Adds ctx.transformedPoint(x,y) - returns an SVGPoint
	function trackTransforms(ctx) {
		var svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
		var xform = svg.createSVGMatrix();
		ctx.getTransform = function () {
			return xform;
		};

		var savedTransforms = [];
		var save = ctx.save;
		ctx.save = function () {
			savedTransforms.push(xform.translate(0, 0));
			return save.call(ctx);
		};
		var restore = ctx.restore;
		ctx.restore = function () {
			xform = savedTransforms.pop();
			return restore.call(ctx);
		};

		var scale = ctx.scale;
		ctx.scale = function (sx, sy) {
			xform = xform.scaleNonUniform(sx, sy);
			return scale.call(ctx, sx, sy);
		};
		var rotate = ctx.rotate;
		ctx.rotate = function (radians) {
			xform = xform.rotate(radians * 180 / Math.PI);
			return rotate.call(ctx, radians);
		};
		var translate = ctx.translate;
		ctx.translate = function (dx, dy) {
			xform = xform.translate(dx, dy);
			return translate.call(ctx, dx, dy);
		};
		var transform = ctx.transform;
		ctx.transform = function (a, b, c, d, e, f) {
			var m2 = svg.createSVGMatrix();
			m2.a = a;
			m2.b = b;
			m2.c = c;
			m2.d = d;
			m2.e = e;
			m2.f = f;
			xform = xform.multiply(m2);
			return transform.call(ctx, a, b, c, d, e, f);
		};
		var setTransform = ctx.setTransform;
		ctx.setTransform = function (a, b, c, d, e, f) {
			xform.a = a;
			xform.b = b;
			xform.c = c;
			xform.d = d;
			xform.e = e;
			xform.f = f;
			return setTransform.call(ctx, a, b, c, d, e, f);
		};
		var pt = svg.createSVGPoint();
		ctx.transformedPoint = function (x, y) {
			pt.x = x;
			pt.y = y;
			return pt.matrixTransform(xform.inverse());
		}
	}
}
Radar.prototype.setIsRotate = function (isRotate) {
	this.isRotate = isRotate;
}

Radar.prototype.getIsRotate = function () {
	return this.isRotate;
}

Radar.prototype.setMap = function (map) {
	this.mapImage.src = map;
}

Radar.prototype.setScale = function (scale) {
	this.scaledFactor = scale;
}

Radar.prototype.map = function (angle) {
	this.rotate_all(angle);
	this.ctx.drawImage(this.mapImage, 0, 0);
	this.restore();
}
Radar.prototype.restore = function () {
	if (this.isRotate)
		this.ctx.restore();
}

Radar.prototype.clear = function () {
	var p1 = this.ctx.transformedPoint(0, 0);
	var p2 = this.ctx.transformedPoint(this.canvas.width, this.canvas.height);
	this.ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
}

Radar.prototype.translate = function (offsetX, offsetY) {
	this.ctx.translate(offsetX, offsetY);
	this.viewPortOffset.X += offsetX;
	this.viewPortOffset.Y -= offsetY;
}

Radar.prototype.setZoom = function (scale) {
	this.scale = scale;
	var pt = this.ctx.transformedPoint(this.canvas.width / 2, this.canvas.height / 2);
	this.scaledFactor *= scale;
	this.ctx.translate(pt.x, pt.y);
	this.ctx.scale(scale, scale);
	this.ctx.translate(-pt.x, -pt.y);
	this.clear()
}

Radar.prototype.setMove = function (offsetX, offsetY) {
	offsetX = offsetX / this.scaledFactor;
	offsetY = offsetY / this.scaledFactor;
	this.translate(offsetX, offsetY);
}
/*
Radar.prototype.setMove = function (offsetX, offsetY,angle) {
	offsetX = offsetX / this.scaledFactor;
	offsetY = offsetY / this.scaledFactor;
	if (angle>=0&&angle<=180) {
		this.translate(offsetX, offsetY);
		}
	if (angle<0&&angle>(-180)) {
		this.translate(-offsetX, -offsetY);
		}

}*/

Radar.prototype.setFocus = function (x, y) {
	var pos = this.coords2Pos(x, y);
	this.translate(this.focusOffset.X - pos.X, this.focusOffset.Y - pos.Y);
	this.focusOffset = pos;

}

Radar.prototype.getFloorNum = function (z0, z1) {
	//console.log(scaledFactor);
	if (typeof (z0) == 'undefined' || typeof (z1) == 'undefined')
		return "";

	if (typeof (z0) != 'undefined' && typeof (z1) != 'undefined') {
		var z = z1 - z0;
		if (z >= 0) {
			zOffset = Math.floor(z / 230);
		} else {
			zOffset = Math.floor(Math.abs(z) / 230);
		}

		if (z > 0 && zOffset != 0 && this.scaledFactor > 1.8) {
			var num = "25B2";
			var uni = '"\\u' + num + '"';
			var hexstring = eval(uni);
			return hexstring + zOffset.toString();
		} else if (z < 0 && zOffset != 0 && this.scaledFactor > 1.8) {
			var num = "25bc";
			var uni = '"\\u' + num + '"';
			var hexstring = eval(uni);
			return hexstring + zOffset.toString();
		} else {
			return '';
		}
	}
}

// translates game coords to overlay coords
Radar.prototype.game2Pix = function (p) {
	return p * (8130 / 813000)
}

Radar.prototype.coords2Pos = function (x, y) {
	return {
		X: this.game2Pix(x),
		Y: this.game2Pix(y)
	}
}

Radar.prototype.dot = function (x, y, angle, color, color1, radius, zone, width) {
	this.rotate_all(angle);
	var pos = this.coords2Pos(x, y);
	this.ctx.beginPath();
	radius = radius / this.scaledFactor;
	this.ctx.arc(pos.X, pos.Y, radius, 0, 2 * Math.PI, false);
	this.ctx.lineWidth = width || 5;
	this.ctx.fillStyle = color || 'red';
	this.ctx.fill()
	this.ctx.beginPath();
	var radius1 = zone / this.scaledFactor;
	this.ctx.arc(pos.X + (0.1 / this.scaledFactor), pos.Y + (-0.1 / this.scaledFactor), radius1, 0, 2 * Math.PI, false);
	this.ctx.lineWidth = width || 5;
	this.ctx.fillStyle = color1 || 'red';
	this.ctx.fill();
	this.restore();

}
Radar.prototype.dot1 = function (x, y, angle, color, width) {
	this.rotate_element(angle, x, y);
	var pos = this.coords2Pos(x, y);
	var radius = 4 / this.scaledFactor;
	this.ctx.beginPath();
	this.ctx.arc(pos.X, pos.Y, radius, 0, 2 * Math.PI, false);
	this.ctx.lineWidth = width || 5;
	this.ctx.fillStyle = color || 'red';
	this.ctx.fill();
	this.restore();
}

Radar.prototype.text = function (x, y, content, color, angle) {
	this.rotate_element(angle, x, y);
	var pos = this.coords2Pos(x, y);
	this.ctx.font = '' + 9 / this.scaledFactor + 'pt Calibri';//YaHei Consolas Hybrid
	this.ctx.lineWidth = 2/ this.scaledFactor;
	this.ctx.strokeStyle = 'black';
	this.ctx.strokeText(content,pos.X, pos.Y + (3 / this.scaledFactor));
	this.ctx.fillStyle = color || 'white';
	this.ctx.textAlign = 'center';
	this.ctx.fillText(content, pos.X, pos.Y + (3 / this.scaledFactor));
	this.restore();
}

Radar.prototype.feiji = function (x, y, angle) {
	var pos = this.coords2Pos(x, y);
	this.ctx.save();
	var x1 = pos.X;
	var y1 = pos.Y;

	var dx = 50;
	var dxx = dx / 2;
	angle = (angle + 90) * Math.PI / 180;

	var image = document.getElementById("airplane");
	this.ctx.translate(x1, y1);
	this.ctx.rotate(angle);
	this.ctx.drawImage(image, 0 - (dxx / this.scaledFactor), 0 - (dxx / this.scaledFactor), dx / this.scaledFactor, dx / this.scaledFactor);
	this.ctx.rotate(-angle);
	this.ctx.translate(-x1, -y1);
	this.ctx.restore();
}
Radar.prototype.xz2 = function (x, y, angle) {
	this.ctx.save();
	var pos = this.coords2Pos(x, y);
	var pt = this.ctx.transformedPoint(this.canvas.width / 2, this.canvas.height / 2);
	this.ctx.translate(pt.x, pt.y);
	this.ctx.rotate((90) * Math.PI / 180);
	var pt = this.ctx.transformedPoint(this.canvas.width / 2, this.canvas.height / 2);
	this.ctx.translate(pt.x, pt.y);
	this.ctx.rotate((angle - 90) * Math.PI / 180);
	this.ctx.translate(-pt.x, -pt.y);

	this.ctx.translate(pos.X, pos.Y);
	this.ctx.rotate(- (angle - 90) * Math.PI / 180);
	this.ctx.translate(- (pos.X), - (pos.Y));
}
Radar.prototype.rotate_element = function (angle, x, y) {
	if (this.isRotate) {
		this.ctx.save();
		var pos = this.coords2Pos(x, y);
		var pt = this.ctx.transformedPoint(this.canvas.width / 2, this.canvas.height / 2);
		this.ctx.translate(pt.x, pt.y);
		this.ctx.rotate((angle - 90) * Math.PI / 180);
		this.ctx.translate(-pt.x, -pt.y);

		this.ctx.translate(pos.X, pos.Y);
		this.ctx.rotate(-(angle - 90) * Math.PI / 180);
		this.ctx.translate(-(pos.X), -(pos.Y));
	}
}
Radar.prototype.rotate_all = function (angle) {
	if (this.isRotate) {
		this.ctx.save();
		var pt = this.ctx.transformedPoint(this.canvas.width / 2, this.canvas.height / 2);
		this.ctx.translate(pt.x, pt.y);
		this.ctx.rotate((angle - 90) * Math.PI / 180);
		this.ctx.translate(-pt.x, -pt.y);
	}
}

/*Radar.prototype.text1 = function (x, y, angle, content, color, zy, sx, cd, kd, yy, size, ap) {
	this.rotate_element(angle, x, y);
	var pos = this.coords2Pos(x, y);
	this.ctx.font = '' + size / this.scaledFactor + 'pt Calibri';//Calibri
	this.ctx.globalAlpha = 0.63;
	this.ctx.fillStyle = "black";
	this.ctx.fillRect(pos.X + (zy / this.scaledFactor), pos.Y + (sx / this.scaledFactor), cd / this.scaledFactor, kd / this.scaledFactor);
	this.ctx.globalAlpha = ap || 1;
	this.ctx.fillStyle = color || 'white';
	this.ctx.textAlign = 'center';
	this.ctx.fillText(content, pos.X, pos.Y + (yy / this.scaledFactor));
	this.restore();
}*/

Radar.prototype.text1 = function (x, y, angle, content, color, zy, sx, cd, kd,yy, size, ap) {
	this.rotate_element(angle, x, y);
	var pos = this.coords2Pos(x, y);
	this.ctx.font = '' + size / this.scaledFactor + 'pt Calibri';//Calibri
	//this.ctx.globalAlpha = 0.63;
	this.ctx.lineWidth = 2/ this.scaledFactor;
	this.ctx.fillStyle = "black";
    this.ctx.strokeText(content,pos.X, pos.Y + (yy / this.scaledFactor));
	this.ctx.fillRect(pos.X + (zy / this.scaledFactor), pos.Y + (sx / this.scaledFactor), cd / this.scaledFactor, 0 / this.scaledFactor);
	this.ctx.globalAlpha = ap || 1;
	this.ctx.fillStyle = color || 'white';
	this.ctx.textAlign = 'center';
	this.ctx.fillText(content, pos.X, pos.Y + (yy / this.scaledFactor));
	this.restore();
}

Radar.prototype.blue = function (x, y, r, angle) {
	this.rotate_all(angle);
	this.ctx.beginPath();
	this.ctx.arc(this.game2Pix(x), this.game2Pix(y), this.game2Pix(r), 0, 2 * Math.PI, false);
	this.ctx.lineWidth = 2 / this.scaledFactor;
	this.ctx.strokeStyle = "blue";
	this.ctx.stroke();
	this.restore();
}

Radar.prototype.white = function (x, y, r, angle) {
	this.rotate_all(angle);
	this.ctx.beginPath();
	this.ctx.arc(this.game2Pix(x), this.game2Pix(y), this.game2Pix(r), 0, 2 * Math.PI, false);
	this.ctx.lineWidth = 2 / this.scaledFactor;
	this.ctx.strokeStyle = "white";
	this.ctx.stroke();
	this.restore();
}

Radar.prototype.circle = function (x, y, r, line, color, angle) {
	this.rotate_all(angle);
	this.ctx.beginPath();
	//this.ctx.arc(this.game2Pix(x) - this.viewPortOffset.X, this.game2Pix(y) + this.viewPortOffset.Y, r, 0, 2 * Math.PI, false);
	this.ctx.arc(this.game2Pix(x), this.game2Pix(y), r, 0, 2 * Math.PI, false);
	this.ctx.lineWidth = line / this.scaledFactor;
	this.ctx.strokeStyle = color;
	this.ctx.stroke();
	this.restore();
}

Radar.prototype.textAtAngle = function (txt, x, y, length, angle, color) {
	var pos = this.coords2Pos(x, y);
	this.ctx.moveTo(pos.X, pos.Y);
	this.ctx.beginPath();
	this.ctx.font = '' + 7 / this.scaledFactor + 'pt YaHei Consolas Hybrid';
	this.ctx.fillStyle = color;
	this.ctx.textAlign = 'center';
	this.ctx.fillText(txt, pos.X + length * Math.cos(Math.PI * angle / 180.0), pos.Y + length * Math.sin(Math.PI * angle / 180.0));
}

Radar.prototype.znz = function (x, y) {
	//this.rotate_all(angle);
	//if (this.isRotate)
	//	return;
	var pos = this.coords2Pos(x, y);
	var radius = 70 / this.scaledFactor;
	this.ctx.beginPath();
	this.ctx.strokeStyle = 'yellow';
	this.ctx.arc(pos.X, pos.Y, radius, 0, 2 * Math.PI, false);
	this.ctx.lineWidth = 1 / this.scaledFactor;
	this.ctx.stroke();
	this.ctx.beginPath();
	//this.ctx.font = '' + 8 / this.scaledFactor + 'YaHei Consolas Hybrid';
	this.ctx.fillStyle = 'white';
	this.ctx.textAlign = 'center';
	var dict = {
		0: "N",
		90: "E",
		180: "S",
		270: "W",
		45: "NE",
		135: "SE",
		225: "SW",
		315: "NW"
	};

	for (j = 0; j < 24; j++) {
		var color = "#FFFFFF";
		var len = 90;
		ang = j * 15;
		tt = Math.abs(ang);
		if (tt > 270 || tt < 90)
			len = 85;
		if (dict[tt]) {
			tt = dict[tt];
			color = "#FF56FF";
			this.textAtAngle(tt + " ", x, y, len / this.scaledFactor, ang - 90, color);
		} else {
			//if(scaledFactor > 0.8){
			this.textAtAngle(tt + " ", x, y, len / this.scaledFactor, ang - 90, color);
			//}
		}
	}
	//this.restore();
}

Radar.prototype.dot2 = function (x, y, angle, color, width) {
	var pos = this.coords2Pos(x, y);
	this.rotate_all(angle);
	var radius = 5.5 / this.scaledFactor;
	this.ctx.beginPath();
	this.ctx.arc(pos.X, pos.Y, radius, 0, 2 * Math.PI, false);
	this.ctx.lineWidth = width || 5;
	this.ctx.fillStyle = color || 'red';
	this.ctx.fill();
	this.restore();
}

Radar.prototype.pieChart = function (x, y, angle, percent, color) {
	var pos = this.coords2Pos(x, y);
	this.rotate_all(angle);
	var radius = 7 / this.scaledFactor;
	var startAngle = 1.5 * Math.PI;
	var endAngle = (percent * 2 * Math.PI) + 1.5 * Math.PI;
	this.ctx.fillStyle = color || 'gray';
	this.ctx.beginPath();
	this.ctx.moveTo(pos.X, pos.Y);
	this.ctx.arc(pos.X, pos.Y, radius, startAngle, endAngle, false);
	this.ctx.closePath();
	this.ctx.fill();
	this.restore();
}

Radar.prototype.weapons = function (x, y, angle, img, dx) {
	try {
		if (img == undefined)
			return;
		var dxx = dx / 2;
		this.rotate_element(angle, x, y);
		var pos = this.coords2Pos(x, y);

		var image = document.getElementById(("i" + img).toLowerCase());
		this.ctx.drawImage(image, pos.X - (dxx / this.scaledFactor), pos.Y - (dxx / this.scaledFactor), dx / this.scaledFactor, dx / this.scaledFactor);

		this.restore();
	} catch (err) { }
}

Radar.prototype.rotate_car = function (angle, x, y) {
	if (!this.isRotate) {
		this.ctx.save();
		var pos = this.coords2Pos(x, y);
		var pt = this.ctx.transformedPoint(this.canvas.width / 2, this.canvas.height / 2);
		this.ctx.translate(pt.x, pt.y);
		this.ctx.rotate((angle - 90) * Math.PI / 180);
		this.ctx.translate(-pt.x, -pt.y);

		this.ctx.translate(pos.X, pos.Y);
		this.ctx.rotate(-(angle - 90) * Math.PI / 180);
		this.ctx.translate(-(pos.X), -(pos.Y));
	}
}

Radar.prototype.restore_car = function () {
	if (!this.isRotate)
		this.ctx.restore();
}

Radar.prototype.cars = function (x, y, angle, img, dx, dy) {
	try {
		if (img == undefined)
			return;
		var dxx = dx / 2;
		var dyy = dy /2;
		this.rotate_element(angle, x, y);
		var pos = this.coords2Pos(x, y);

		var image = document.getElementById(("c" + img).toLowerCase());
		this.ctx.drawImage(image, pos.X - (dxx / this.scaledFactor), pos.Y - (dyy / this.scaledFactor), dx / this.scaledFactor, dy / this.scaledFactor);

		this.restore();
	} catch (err) { }
}

Radar.prototype.ktx = function (x, y, angle) {
	this.rotate_element(angle, x, y);
	var pos = this.coords2Pos(x, y);
	var image = document.getElementById("kt");
	var dx = 35;
	var dxx = dx / 2;
	this.ctx.drawImage(image, pos.X - (dxx / this.scaledFactor), pos.Y - (dxx / this.scaledFactor), dx / this.scaledFactor, dx / this.scaledFactor);
	this.restore();
}


// useless
Radar.prototype.floatText = function (posX, posY, content, color, zy, sx, width, height, size, ap) {
	this.ctx.font = '' + size / this.scaledFactor + 'pt Calibri';
	this.ctx.globalAlpha = 0.63;
	this.ctx.fillStyle = "black";
	this.ctx.fillRect(posX - this.viewPortOffset.X + (zy / this.scaledFactor), posY + this.viewPortOffset.Y + 30 + (sx / this.scaledFactor), width / this.scaledFactor, height / this.scaledFactor);
	this.ctx.globalAlpha = ap || 1;
	this.ctx.fillStyle = color || 'white';
	this.ctx.textAlign = 'center';
	this.ctx.fillText(content, posX - this.viewPortOffset.X, posY + this.viewPortOffset.Y + 30);
}

Radar.prototype.distance = function (p1, p2) {
	return parseInt(this.game2Pix(Math.sqrt(Math.pow((p1.x - p2.x), 2) + Math.pow((p1.y - p2.y), 2))));
}

function getPointOnCircle(radius, originPt, endPt) {
	angleInDegrees = getAngleBetweenPoints(originPt, endPt);
	// Convert from degrees to radians via multiplication by PI/180
	var x = radius * Math.cos(angleInDegrees * Math.PI / 180) + originPt.x;
	var y = radius * Math.sin(angleInDegrees * Math.PI / 180) + originPt.y;
	return {
		x: x,
		y: y
	};
}

function getAngleBetweenPoints(originPt, endPt) {
	var interPt = {
		x: endPt.x - originPt.x,
		y: endPt.y - originPt.y
	};
	return Math.atan2(interPt.y, interPt.x) * 180 / Math.PI;
}

Radar.prototype.isLookatU = function (x0, y0, x1, y1, angle) {
	var isLookU = false;
	var ang = Math.abs(angle);
	var distance = this.game2Pix(Math.sqrt(Math.pow((x0 - x1), 2) + Math.pow((y0 - y1), 2)));

	if (ang > 90)
		ang = 180 - ang;

	var disCalcu = this.game2Pix(Math.abs(Math.abs(x0) - Math.abs(x1)) / Math.cos(ang / 180 * Math.PI));

	if (Math.abs(disCalcu - distance) < 10 && distance < 500) {
		isLookU = true;
	}

	if ((x1 > x0) && (Math.abs(angle) < 90)) {
		isLookU = false;
	}

	if ((x1 < x0) && (Math.abs(angle) > 60)) {
		isLookU = false;
	}

	if ((x1 < x0) && angle < 0) {
		isLookU = false;
	}

	if ((y1 > y0) && angle > 0)
		isLookU = false;

	//3
	if ((x1 < x0) && (y1 > y0) && ((angle > 0) || (angle < -90))) {
		isLookU = false;
	}

	//4
	if ((x1 > x0) && (y1 > y0) && (angle > -90)) {
		isLookU = false;
	}

	//1
	if ((x1 > x0) && (y1 < y0) && ((angle > -180) && (angle < 90))) {
		isLookU = false;
	}

	//2
	if ((x1 < x0) && (y1 < y0) && ((angle > 90) || (angle < -90))) {
		isLookU = false;
	}

	return isLookU;
}

Radar.prototype.lineWithAngle = function (x, y, xzjd, length, width, angle, color) {
	var pos = this.coords2Pos(x, y);
	this.rotate_all(xzjd);
	var anX = 5 * Math.cos(Math.PI * angle / 180.0);
	var anY = 5 * Math.sin(Math.PI * angle / 180.0);

	var x1 = pos.X + anX;
	var y1 = pos.Y + anY;

	var circle1 = {
		x: pos.X,
		y: pos.Y,
		r: 5
	};
	var circle2 = {
		x: x1,
		y: y1,
		r: 0
	};

	var arrow = {
		h: width / this.scaledFactor,
		w: length / this.scaledFactor
	};
	drawArrow(this.ctx, arrow, circle1, circle2, color);
	this.restore();
	//Radar.prototype.lineWithAngle = function (x, y, length, width, angle, color)
	function drawArrow(canvasContext, arrow, ptArrow, endPt, color) {
		angleInDegrees = getAngleBetweenPoints(ptArrow, endPt);
		endPt = getPointOnCircle(endPt.r, ptArrow, endPt);
		// first save the untranslated/unrotated context
		canvasContext.save();

		// move the rotation point to the center of the rect
		canvasContext.translate(endPt.x, endPt.y);
		// rotate the rect
		canvasContext.rotate(angleInDegrees * Math.PI / 180);
		canvasContext.beginPath();
		canvasContext.moveTo(0, 0);

		canvasContext.lineTo(0, (-arrow.h));
		canvasContext.lineTo((arrow.w), 0);
		canvasContext.lineTo(0, (+arrow.h));
		canvasContext.closePath();
		canvasContext.fillStyle = color;
		canvasContext.lineWidth = 0;
		//canvasContext.stroke();
		canvasContext.fill();

		// restore the context to its untranslated/unrotated state
		canvasContext.restore();
	}

}

Radar.prototype.longLine = function (x, y, xzjd, length, width, angle, color) {
	var pos = this.coords2Pos(x, y);
	this.rotate_all(xzjd);
	var anX = 5 * Math.cos(Math.PI * angle / 180.0);
	var anY = 5 * Math.sin(Math.PI * angle / 180.0);

	var x1 = pos.X + anX;
	var y1 = pos.Y + anY;

	var circle1 = {
		x: pos.X,
		y: pos.Y,
		r: 5
	};
	var circle2 = {
		x: x1,
		y: y1,
		r: 0
	};

	var arrow = {
		h: width / this.scaledFactor,
		w: 50000 / this.scaledFactor
	};
	drawLine(this.ctx, arrow, circle1, circle2, color, this.scaledFactor);
	this.restore();

	function drawLine(canvasContext, arrow, ptArrow, endPt, color, sf) {
		angleInDegrees = getAngleBetweenPoints(ptArrow, endPt);
		endPt = getPointOnCircle(endPt.r, ptArrow, endPt);
		// first save the untranslated/unrotated context
		canvasContext.save();

		// move the rotation point to the center of the rect
		canvasContext.translate(endPt.x, endPt.y);
		// rotate the rect
		canvasContext.rotate(angleInDegrees * Math.PI / 180);
		canvasContext.beginPath();
		canvasContext.moveTo(0, 0);

		//canvasContext.lineTo(0, (-arrow.h));
		canvasContext.lineTo((arrow.w), 0);
		//canvasContext.lineTo(0, (+arrow.h));
		canvasContext.closePath();
		canvasContext.strokeStyle = color;
		canvasContext.lineWidth = width / sf;
		//console.log("sc" + 1/sf);
		canvasContext.stroke();
		//canvasContext.fill();

		// restore the context to its untranslated/unrotated state
		canvasContext.restore();
	}

}

Radar.prototype.longDashedLine = function (x1, y1, x2, y2, xzjd, length, width, color) {

	this.rotate_all(xzjd);
	//this.restore();	
	this.ctx.beginPath();
	this.ctx.setLineDash([20]);
	this.ctx.moveTo(this.game2Pix(x1), this.game2Pix(y1));
	this.ctx.lineTo(this.game2Pix(x2),this.game2Pix(y2));
	this.ctx.strokeStyle = "white";
	this.ctx.lineWidth = 2 / this.scaledFactor;
	this.ctx.stroke();
	this.restore();

	this.ctx.setLineDash([]);

}