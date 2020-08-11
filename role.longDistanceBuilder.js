var roleBuilder = require('role.builder');
var roleLongDistanceBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {
        roleBuilder.run(creep);
	}
};

module.exports = roleLongDistanceBuilder;
