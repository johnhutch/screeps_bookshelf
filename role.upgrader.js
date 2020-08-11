var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function(creep) {
        creep.buildRoad();

	    if (creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.working = false;
            creep.say('🔄 harvest');
	    }
	    if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
	        creep.memory.working = true;
	        creep.say('🚧 upgrade');
	    }

	    if(!creep.memory.working) {
          if (creep.memory.targetRoom == undefined
            && creep.room.memory.hasContainers) {
              creep.getEnergy(true, false);
          } else {
              creep.getEnergy(true, true);
          }
      }
      else {
          if(creep.memory.targetRoom && (creep.memory.targetRoom != creep.room.name)) {
              let exit = creep.room.findExitTo(creep.memory.targetRoom);
              creep.moveTo(creep.pos.findClosestByRange(exit));
          } else if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
              creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffaa00'}});
          }
      }
	}
};

module.exports = roleUpgrader;
