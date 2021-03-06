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
        if (hostile == undefined) {

          let target = undefined;

          // see if we have any brand new ramparts or dying containers to keep alive
          structures = this.room.find(FIND_STRUCTURES, {
              filter: (s) => ((s.structureType == STRUCTURE_RAMPART
                            || s.structureType == STRUCTURE_CONTAINER)
                            && s.hits < 5000)
          });

          // if no ramparts, 
          // see if we have any urgent repairs and we have spare resources to do it with
          if ( (this.store.getUsedCapacity(RESOURCE_ENERGY) > this.store.getCapacity(RESOURCE_ENERGY) / 2)
            && (this.room.energyCapacityAvailable === this.room.energyAvailable)
            && (structures == "")) {
              // find all potential structures that need a bit more than a tiny bit of fixing
              let structures = this.room.find(FIND_STRUCTURES, {
                  filter: (s) => (s.structureType != STRUCTURE_WALL
                                  && s.structureType != STRUCTURE_ROAD
                                  && s.structureType != STRUCTURE_RAMPART
                                  && s.hits < s.hitsMax / 1.2)
              });
          }

          // we have a new rampart to help along
          if (structures) {
              structures = _.sortBy(structures, (s) => { return s.hits  });
              target = structures[0];
          }

          // if we find a structure that has to be repaired
          if (target != undefined) {
              this.repair(target)
          } else {
          }
        }
    };
