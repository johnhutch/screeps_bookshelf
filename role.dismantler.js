var roleUpgrader = require('role.upgrader');

module.exports = {
    run: function(creep) {

        // creep was never given a target room, and we don't want him just dismantling shit
        if (!creep.memory.targetRoom && !creep.memory.targetId) {
            roleUpgrader.run(creep);
        } else {
            if(creep.memory.targetRoom && (creep.memory.targetRoom != creep.room.name)) {
                let exit = creep.room.findExitTo(creep.memory.targetRoom);
                creep.moveTo(creep.pos.findClosestByRange(exit));
            } else {
                if (!creep.memory.targetId) {
                    module.exports.findTarget(creep);
                }

                let target = Game.getObjectById(creep.memory.targetId);
                let result = creep.dismantle(target);

                if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
                if (result == ERR_INVALID_TARGET) {
                    module.exports.findTarget(creep);
                }
            }
        }
    },

    findTarget: function(creep) {
        let walls = creep.room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType == STRUCTURE_WALL
        });
        if (walls) {
            walls = _.sortBy(walls, (w) => { return w.hits  });
            target = walls[0];
        }
        creep.memory.targetId = target.id || null;
    }

};
