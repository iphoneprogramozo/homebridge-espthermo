var request = require("request");
var Service, Characteristic;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-espthermo", "EspThermo", LockAccessory);
}

function LockAccessory(log, config) {
    this.log = log;
    this.name = config["name"];
    this.url = config["url"];
    this.lockID = config["lock-id"];
    this.username = config["username"];
    this.password = config["password"];

    this.battservice = new Service.BatteryService(this.name);

    this.battservice
        .getCharacteristic(Characteristic.BatteryLevel)
        .on('get', this.getBattery.bind(this));

    this.battservice
        .getCharacteristic(Characteristic.ChargingState)
        .on('get', this.getCharging.bind(this));

    this.battservice
        .getCharacteristic(Characteristic.StatusLowBattery)
        .on('get', this.getLowBatt.bind(this));
        
    this.tempservice = new Service.TemperatureSensor(this.name);
    
    this.tempservice
        .getCharacteristic(Characteristic.CurrentTemperature)
        .on('get', this.getTemp.bind(this));

}

LockAccessory.prototype.getTemp = function(callback) {
    this.log("Getting current temperature...");

    request.get({
        url: this.url,
        qs: { username: this.username, password: this.password, lockid: this.lockID }
    }, function(err, response, body) {
        if (!err && response.statusCode == 200) {
            var json = JSON.parse(body);
            var temp = json.temp;
            temp = 34; //hack 
            this.log("Temperature is %s", temp);
            callback(null, temp); // success
        } else {
            if (response && response.statusCode) {
                this.log("Error getting temperature (status code %s): %s", response.statusCode, err);
            }
            callback(err);
        }
    }.bind(this));
}

LockAccessory.prototype.getBattery = function(callback) {
    this.log("Getting current battery...");

    request.get({
        url: this.url,
        qs: { username: this.username, password: this.password, lockid: this.lockID }
    }, function(err, response, body) {

        if (!err && response.statusCode == 200) {
            var json = JSON.parse(body);
            var batt = json.battery;
            this.log("Lock battery is %s", batt);
            callback(null, batt); // success
        }
        else {
            if (response && response.statusCode) {
                this.log("Error getting battery (status code %s): %s", response.statusCode, err);
            }
            callback(err);
        }
    }.bind(this));
}

LockAccessory.prototype.getCharging = function(callback) {
    callback(null, Characteristic.ChargingState.NOT_CHARGING);
}

LockAccessory.prototype.getLowBatt = function(callback) {
    this.log("Getting current battery...");

    request.get({
        url: this.url,
        qs: { username: this.username, password: this.password, lockid: this.lockID }
    }, function(err, response, body) {

        if (!err && response.statusCode == 200) {
            var json = JSON.parse(body);
            var batt = json.battery;
            this.log("Lock battery is %s", batt);
            var low = (batt > 20) ? Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL : Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW;
            callback(null, low); // success
        }
        else {
            if (response && response.statusCode) {
                this.log("Error getting battery (status code %s): %s", response.statusCode, err);
            }
            callback(err);
        }
    }.bind(this));
}

LockAccessory.prototype.getServices = function() {
    return [this.battservice, this.tempservice];
}
