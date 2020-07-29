var roleUpgrader = require('role.upgrader');
var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {

	    if (creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.working = false;
            creep.say('🔄 harvest');
	    }
	    if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
	        creep.memory.working = true;
	        creep.say('🚧 build');
	    }

	    if(creep.memory.working) {
          if(creep.memory.target && (creep.memory.target != creep.room.name)) {
              let exit = creep.room.findExitTo(creep.memory.target);
              creep.moveTo(creep.pos.findClosestByRange(exit));
          } else {
              var target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
              if(target) {
                  if(creep.build(target) == ERR_NOT_IN_RANGE) {
                      creep.moveTo(target, {visualizePathStyle: {stroke: '#00ff00'}});
                  }
              } else {
                  // go upgrading the controller
                  roleUpgrader.run(creep);
              }
          }
	    }
	    else {
            if(creep.memory.target == undefined) {
                creep.getEnergy(true, false);
            } else {
                creep.getEnergy(true, true);
            }
	    }
	}
};

module.exports = roleBuilder;
