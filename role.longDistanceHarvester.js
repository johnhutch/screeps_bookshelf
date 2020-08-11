module.exports = {
    run: function(creep) {

        creep.buildRoad();

        // if creep is bringing energy to a structure but has no energy left
        if (creep.memory.working == true && creep.store[RESOURCE_ENERGY ]== 0) {
            creep.memory.working = false;
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && creep.store[RESOURCE_ENERGY] == creep.store.getCapacity()) {
            creep.memory.working = true;
            module.exports.findTarget(creep);
        }

        // if creep is supposed to transfer energy to a structure
        if (creep.memory.working == true) {
            creep.unload(creep.memory.home);
        }
        // if creep is supposed to harvest energy from source
        else {
            // if in target targetRoom
            if (creep.room.name == creep.memory.targetRoom) {
                module.exports.findTarget(creep);
                creep.getEnergy(true, true);
            } else {
                // if not in target targetRoom
                // find exit to target targetRoom
                var exit = creep.room.findExitTo(creep.memory.targetRoom);
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
        }
    },

    findTarget: function(creep) {
        // if we can see into our targetRoom, plot the path
        if (Game.rooms[creep.memory.targetRoom]) {
            let target = undefined;
            // look for an energy source in the target room
            let remoteSources = Game.rooms[creep.memory.targetRoom].energySources(true);
            if (remoteSources.length > 0) {
                // if we find some, assign one to the creep's memory
                creep.memory.targetId = remoteSources[0].id;
            }
        }
    }
};
