document.addEventListener("DOMContentLoaded", function () {
    rainer.init();
    window.addEventListener('resize', rainer.resize);
});

var rainer = {
    speed: 0.5,
    color: {
        r: '233',
        g: '197',
        b: '250',
        a: '0.35'
    },
    started: false,
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    dpr: window.devicePixelRatio || 1,
    drop_time: 0,
    drop_delay: 30,
    wind: 2,
    rain_color: null,
    rain_color_clear: null,
    rain: [],
    rain_pool: [],
    drops: [],
    drop_pool: []
};

rainer.init = function () {
    if (!rainer.started) {
        rainer.started = true;
        rainer.canvas = document.getElementById('canvas');
        rainer.ctx = rainer.canvas.getContext('2d');
        var c = rainer.color;
        rainer.rain_color = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + c.a + ')';
        rainer.rain_color_clear = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0)';
        rainer.resize();
        Ticker.addListener(rainer.step);

        const gui = new dat.GUI();
        gui.add(rainer, 'speed', 0.2, 2);

        var instructions = document.getElementById('instructions');
        setTimeout(function () {
            instructions.style.opacity = 0;
            setTimeout(function () {
                instructions.parentNode.removeChild(instructions);
            }, 2000);
        }, 4000);
    }
}

rainer.resize = function () {
    var rain = rainer.rain;
    var drops = rainer.drops;
    for (var i = rain.length - 1; i >= 0; i--) {
        rain.pop().recycle();
    }
    for (var i = drops.length - 1; i >= 0; i--) {
        drops.pop().recycle();
    }
    rainer.width = window.innerWidth;
    rainer.height = window.innerHeight;
    rainer.canvas.width = rainer.width * rainer.dpr;
    rainer.canvas.height = rainer.height * rainer.dpr;
}

rainer.step = function (time, lag) {
    var rainer = window.rainer;
    var speed = rainer.speed;
    var width = rainer.width;
    var height = rainer.height;
    var wind = rainer.wind;
    var rain = rainer.rain;
    var rain_pool = rainer.rain_pool;
    var drops = rainer.drops;
    var drop_pool = rainer.drop_pool;

    var multiplier = speed * lag;

    rainer.drop_time += time * speed;
    while (rainer.drop_time > rainer.drop_delay) {
        rainer.drop_time -= rainer.drop_delay;
        var new_rain = rain_pool.pop() || new Rain();
        new_rain.init();
        var wind_expand = Math.abs(height / new_rain.speed * wind);
        var spawn_x = Math.random() * (width + wind_expand);
        if (wind > 0) spawn_x -= wind_expand;
        new_rain.x = spawn_x;
        rain.push(new_rain);
    }

    for (var i = rain.length - 1; i >= 0; i--) {
        var r = rain[i];
        r.y += r.speed * r.z * multiplier;
        r.x += r.z * wind * multiplier;
        if (r.y > height) {
            r.splash();
        }
        if (r.y > height + Rain.height * r.z || (wind < 0 && r.x < wind) || (wind > 0 && r.x > width + wind)) {
            r.recycle();
            rain.splice(i, 1);
        }
    }

    var drop_max_speed = Drop.max_speed;
    for (var i = drops.length - 1; i >= 0; i--) {
        var d = drops[i];
        d.x += d.speed_x * multiplier;
        d.y += d.speed_y * multiplier;
        d.speed_y += 0.3 * multiplier;
        d.speed_x += wind / 25 * multiplier;
        if (d.speed_x < -drop_max_speed) {
            d.speed_x = -drop_max_speed;
        } else if (d.speed_x > drop_max_speed) {
            d.speed_x = drop_max_speed;
        }
        if (d.y > height + d.radius) {
            d.recycle();
            drops.splice(i, 1);
        }
    }

    rainer.draw();
}

rainer.draw = function () {
    var rainer = window.rainer;
    var width = rainer.width;
    var height = rainer.height;
    var dpr = rainer.dpr;
    var rain = rainer.rain;
    var drops = rainer.drops;
    var ctx = rainer.ctx;

    ctx.clearRect(0, 0, width * dpr, height * dpr);

    ctx.beginPath();
    var rain_height = Rain.height * dpr;
    for (var i = rain.length - 1; i >= 0; i--) {
        var r = rain[i];
        var real_x = r.x * dpr;
        var real_y = r.y * dpr;
        ctx.moveTo(real_x, real_y);
        ctx.lineTo(real_x - rainer.wind * r.z * dpr * 1.5, real_y - rain_height * r.z);
    }
    ctx.lineWidth = Rain.width * dpr;
    ctx.strokeStyle = rainer.rain_color;
    ctx.stroke();

    for (var i = drops.length - 1; i >= 0; i--) {
        var d = drops[i];
        var real_x = d.x * dpr - d.radius;
        var real_y = d.y * dpr - d.radius;
        ctx.drawImage(d.canvas, real_x, real_y);
    }
}


function Rain() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.speed = 25;
    this.splashed = false;
}
Rain.width = 2;
Rain.height = 40;
Rain.prototype.init = function () {
    this.y = Math.random() * -100;
    this.z = Math.random() * 0.5 + 0.5;
    this.splashed = false;
}
Rain.prototype.recycle = function () {
    rainer.rain_pool.push(this);
}
Rain.prototype.splash = function () {
    if (!this.splashed) {
        this.splashed = true;
        var drops = rainer.drops;
        var drop_pool = rainer.drop_pool;

        for (var i = 0; i < 16; i++) {
            var drop = drop_pool.pop() || new Drop();
            drops.push(drop);
            drop.init(this.x);
        }
    }
}


function Drop() {
    this.x = 0;
    this.y = 0;
    this.radius = Math.round(Math.random() * 2 + 1) * rainer.dpr;
    this.speed_x = 0;
    this.speed_y = 0;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    // render once and cache
    var diameter = this.radius * 2;
    this.canvas.width = diameter;
    this.canvas.height = diameter;

    var grd = this.ctx.createRadialGradient(this.radius, this.radius, 1, this.radius, this.radius, this.radius);
    grd.addColorStop(0, rainer.rain_color);
    grd.addColorStop(1, rainer.rain_color_clear);
    this.ctx.fillStyle = grd;
    this.ctx.fillRect(0, 0, diameter, diameter);
}

Drop.max_speed = 5;

Drop.prototype.init = function (x) {
    this.x = x;
    this.y = rainer.height;
    var angle = Math.random() * Math.PI - (Math.PI * 0.5);
    var speed = Math.random() * Drop.max_speed;
    this.speed_x = Math.sin(angle) * speed;
    this.speed_y = -Math.cos(angle) * speed;
}
Drop.prototype.recycle = function () {
    rainer.drop_pool.push(this);
}

rainer.mouseHandler = function (evt) {
    rainer.updateCursor(evt.clientX, evt.clientY);
}
rainer.touchHandler = function (evt) {
    evt.preventDefault();
    var touch = evt.touches[0];
    rainer.updateCursor(touch.clientX, touch.clientY);
}
rainer.updateCursor = function (x, y) {
    x /= rainer.width;
    y /= rainer.height;
    var y_inverse = (1 - y);

    rainer.drop_delay = y_inverse * y_inverse * y_inverse * 100 + 2;
    rainer.wind = (x - 0.5) * 50;
}

document.addEventListener('mousemove', rainer.mouseHandler);
document.addEventListener('touchstart', rainer.touchHandler);
document.addEventListener('touchmove', rainer.touchHandler);

var Ticker = (function () {
    var PUBLIC_API = {};

    PUBLIC_API.addListener = function addListener(fn) {
        if (typeof fn !== 'function') throw ('Ticker.addListener() requires a function reference passed in.');

        listeners.push(fn);

        // start frame-loop lazily
        if (!started) {
            started = true;
            queueFrame();
        }
    };

    var started = false;
    var last_timestamp = 0;
    var listeners = [];
    function queueFrame() {
        if (window.requestAnimationFrame) {
            requestAnimationFrame(frameHandler);
        } else {
            webkitRequestAnimationFrame(frameHandler);
        }
    }
    function frameHandler(timestamp) {
        var frame_time = timestamp - last_timestamp;
        last_timestamp = timestamp;
        if (frame_time < 0) {
            frame_time = 17;
        }
        else if (frame_time > 68) {
            frame_time = 68;
        }

        for (var i = 0, len = listeners.length; i < len; i++) {
            listeners[i].call(window, frame_time, frame_time / 16.67);
        }
        queueFrame();
    }

    return PUBLIC_API;
}());