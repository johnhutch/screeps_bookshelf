// create a new function for StructureTower
StructureTower.prototype.defend =
    function () {
        // find closest hostile creep
        let target = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

        // and then murder it
        if (target != undefined) {
            this.attack(target);
            try {
                let username = target.owner.username;
                Game.notify(`User ${username} spotted in room ${target.room}`);
            } catch(error) {
                console.log("caught an error trying to notify about a user attacking");
                console.error(error);
            }
        }
    };

StructureTower.prototype.make_repairs = 
    function () {
        // if tower has more than half energy (i.e., energy to spare)
        if (this.store.getUsedCapacity(RESOURCE_ENERGY) > this.store.getCapacity(RESOURCE_ENERGY) / 2) {
          // find closest structure with less than 2/3 of its life
          let closestDamagedStructure = this.pos.findClosestByRange(FIND_STRUCTURES, {
              filter: (target) => target.hits < target.hitsMax / 1.5
          });

          // and then repair it a bit
          if(closestDamagedStructure) {
              this.repair(closestDamagedStructure);
          }
        }
    };
