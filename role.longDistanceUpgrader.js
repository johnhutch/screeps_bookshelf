var roleUpgrader = require('role.upgrader');
var roleLongDistanceUpgrader = {

    /** @param {Creep} creep **/
    run: function(creep) {
        roleUpgrader.run(creep);
	}
};

module.exports = roleLongDistanceUpgrader;
