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
        let hostile = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        // if tower has more than half energy (i.e., energy to spare)
        // and the room is at full capacity
        // and no one's attacking
        if ( (this.store.getUsedCapacity(RESOURCE_ENERGY) > this.store.getCapacity(RESOURCE_ENERGY) / 2)
          && (this.room.energyCapacityAvailable === this.room.energyAvailable)
          && (hostile == undefined) ) {

          // find all potential structures that need a bit more than a tiny bit of fixing
          var structures = this.room.find(FIND_STRUCTURES, {
              filter: (target) => target.hits < target.hitsMax / 1.2
          });

          var target = undefined;

          // loop with increasing percentages
          for (let percentage = 0.0001; percentage <= 1; percentage = percentage + 0.0001){
              // find a structure with less than percentage hits
              for (let structure of structures) {
                  if (structure.hits / structure.hitsMax < percentage) {
                      target = structure;
                      break;
                  }
              }

              // if there is one
              if (target != undefined) {
                  // break the loop
                  break;
              }
          }

          // if we find a structure that has to be repaired
          if (target != undefined) {
            this.repair(target)
          }
        }
    };
