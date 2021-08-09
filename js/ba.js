function ba() {
    this.d;
    this.mapid = 0;
    this.zone;
    this.p;
    this.win_width;
    this.is_big_map;
    this.mapSizeRate = 1;
    this.enamary_nearest = 1000;
    this.enamary_farest = 2;
    this.is_enamary_100_300 = false;
    this.br;
    this.inCar = false;
    this.inAir = false;
    this.is_enamary_100_300;
    this.is_final;
    this.scale_final;
    this.is_in_stg_1;
    this.scaleFactor;
}

ba.prototype.setdata = function (data, winw) {
    this.d = data;
    this.win_width = winw - 100;
    if (this.d.p) {
        this.mapid = this.d.c.m;
        this.zone = this.d.z;
        this.p = this.d.p;
        this.is_big_map = this.is_big_map_f();

        if (this.is_big_map)
            this.mapSizeRate = 1;
        else if (this.is_sanhok())
            this.mapSizeRate = 0.5;
        else if (this.is_vikendi())
            this.mapSizeRate = 0.7;

        this.enamary_nearest = 1000;
        this.enamary_farest = 2;
        var players = this.d.p;
        for (var i = players.length - 1; i >= 0; i--) {
            var __t = players[i].t;
            var _player = players[i];
            var _h1 = (_player.h == undefined) ? 100 : _player.h;
            var _isAlive = (_h1 !== 0);
            var _isPlayerSelf = (i == 0);
            var _isTeamMem = (players[i].t == players[0].t && !_isPlayerSelf);

            if ((players[0].z > 20000) && this.inAir == false)
                this.inAir = true;
            var _dis = this.distance(player0, _player);
            if (_dis >= 100 && _dis <= 300)
                this.is_enamary_100_300 = true;
            if (!_isPlayerSelf && !_isTeamMem && _isAlive && (_dis < this.enamary_nearest)) {
                this.enamary_nearest = _dis;
            }
            if (!_isPlayerSelf && !_isTeamMem && _isAlive && (_dis >= this.enamary_farest)) {
                this.enamary_farest = _dis;
            }

        }

        this.inCar = (players[0].i);
        this.is_final = this.is_in_stage_final();
        this.scale_final = this.get_scale_final();
        this.is_in_stg_1 = this.is_in_stage_1();

    }
};

ba.prototype.distance = function (p1, p2) {
    return parseInt((Math.sqrt(Math.pow((p1.x - p2.x), 2) + Math.pow((p1.y - p2.y), 2))) / 100);
};

ba.prototype.get_to_scale = function () {
    //return 1;
    if (this.inAir) {
        return this.set_scale(800);
    } else {

        if (this.inCar && !this.is_final) {
            return this.set_scale(1000);
        }

        if (this.is_final) {
            return this.scale_final;
        }

        if (this.enamary_nearest >= 50 && this.enamary_nearest < 300 && !this.is_in_stg_1) {
            //return this.set_scale(350);
        }

        if (this.enamary_nearest >= 15 && this.enamary_nearest < 50) {
            return this.set_scale(30);
        }

        if (this.enamary_nearest > 2 && this.enamary_nearest < 15) {
            return this.set_scale(15);
        }

        if (this.enamary_nearest >= 500 && this.is_in_stg_1) {
            return this.set_scale(80);
        }

        if (this.enamary_nearest >= 500 && !this.is_in_stg_1) {
            return this.set_scale(200);
        }

        if (this.enamary_nearest >= 300 && this.enamary_nearest < 500 && this.is_in_stg_1) {
            return this.set_scale(250);
        }

        if (this.enamary_nearest >= 200 && this.enamary_nearest < 300 && this.is_in_stg_1) {
            return this.set_scale(150);
        }

        //return this.set_scale(this.enamary_nearest);
    }
};

ba.prototype.set_scale = function (s) {
    var sc = this.win_width / s / 1.9 / this.mapSizeRate;
    //var sc = s / this.mapSizeRate;
    if (this.is_big_map && sc > 6)
        sc = 6;

    if (!this.is_big_map && sc > 4)
        sc = 4;

    // console.log("cal s:" + sc);
    // console.log("n:" + this.enamary_nearest);
    if (sc - this.scaleFactor > 0.02)
        return sc;
    else
        return 0 - sc;
};

ba.prototype.is_erangel = function () {
    return this.mapid == 0;
};

ba.prototype.is_miramar = function () {
    return this.mapid == 1;
};

ba.prototype.is_sanhok = function () {
    return this.mapid == 2;
};

ba.prototype.is_vikendi = function () {
    return this.mapid == 3;
};

ba.prototype.is_in_island = function () {
    return (this.zone.r == 0 && this.zone.x == 0 && this.p.length > 18 && this.enamary_nearest < 20);
};

ba.prototype.is_big_map_f = function () {
    return (this.is_erangel() || this.is_miramar());
};

ba.prototype.const_first_br = function () {
    if (this.is_big_map)
        return 550000;
    else if (this.is_sanhok)
        return 290000;
    else //vikendi
        return 300000;
};

ba.prototype.const_first_wr = function () {
    if (this.is_big_map)
        return 200000;
    else if (this.is_sanhok)
        return 140000;
    else //vikendi
        return 120000;
};

ba.prototype.const_stage_4_wr = function () {
    if (this.is_big_map)
        return 35000;
    else if (this.is_sanhok)
        return 31000;
    else //vikendi
        return 50000;
};

ba.prototype.const_stage_final = function () {
    if (this.is_big_map)
        return 30000;
    else if (this.is_sanhok)
        return 20000;
    else //vikendi
        return 23000;
};

ba.prototype.is_in_stage_1 = function () {
    return (this.zone.br > this.const_first_wr() && this.zone.br > this.zone.r * 2);
};

ba.prototype.is_after_stage_4 = function () {
    return (this.zone.r < this.const_stage_4_wr());
};

ba.prototype.is_in_stage_final = function () {
    return (this.zone.r > 0 && this.zone.r < this.const_stage_final());
}

//全局
ba.prototype.get_scale_s_1 = function () {
    return this.set_scale(800);
};

ba.prototype.get_scale_default = function () {
    if (this.is_after_stage_4()) {
        return this.set_scale(800);
    } else {
        return this.set_scale(900);
    }
};

ba.prototype.get_scale_final = function () {
    if (this.enamary_farest < 150)
        return this.set_scale(150);
    else if (this.enamary_farest < 200)
        return this.set_scale(200);

    return this.set_scale(Math.ceil(this.enamary_farest / 100) * 100);
};