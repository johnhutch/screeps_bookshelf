var roleUpgrader = require('role.upgrader');
var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {

	    if (creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
            // look and see if we maybe picked up some minerals by accident and unload them
            if (_.sum(creep.store) > 0 ) {
                creep.unload();
            } else {
                creep.memory.working = false;
                creep.say('🔄 harvest');
            }
	    }
        else if (creep.memory.working == false && _.sum(creep.store) == creep.store.getCapacity() ) {
	        creep.memory.working = true;
	        creep.say('🚧 build');
	    }

	    if(creep.memory.working) {
          if(creep.memory.targetRoom && (creep.memory.targetRoom != creep.room.name)) {
              let exit = creep.room.findExitTo(creep.memory.targetRoom);
              creep.moveTo(creep.pos.findClosestByRange(exit));
          } else {
              var target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, { filter: (s) => s.structureType != STRUCTURE_ROAD });
              if(target) {
                  if(creep.build(target) == ERR_NOT_IN_RANGE) {
                      creep.moveTo(target, {visualizePathStyle: {stroke: '#00ff00'}});
                  }
              } else {
                  var target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES)
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
	    }
	    else {
            // if we're a remote builder OR or the room doesn't have any containers or we're trying to build a container for a miner, use sources
            if (creep.memory.targetRoom != undefined 
             || !creep.room.memory.hasContainers
             || (!creep.room.storage && !creep.room.terminal)
             || creep.room.isBuildingSourceContainers()) {
                creep.getEnergy(true, true);
            } else {
                creep.getEnergy(true, false);
            }
	    }
	}
};

module.exports = roleBuilder;
