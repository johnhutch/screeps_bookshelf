Room.prototype.checkForContainers = 
    function() {
        let sources = this.find(FIND_SOURCES);
        for (let source of sources) {
            let containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: s => s.structureType == STRUCTURE_CONTAINER
            });
            if (containers.length > 0) {
                this.memory.hasContainers = true;
                break;
            }
            this.memory.hasContainers = false;
        }
    };
