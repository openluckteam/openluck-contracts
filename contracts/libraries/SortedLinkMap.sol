// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


library SortedLinkMap {

    struct Item {        
        uint id;
        uint value;
        uint leftId;
    }

    uint constant None = uint(0);

    struct SortedMap {
        uint count;
        uint maxId;
        mapping(uint => uint) keys; // id => id , linked list
        mapping(uint => Item) nodes; // id => value item
    }
    
    function add(SortedMap storage self, uint id, uint value) internal {                

        require(id > 0, "require id > 0");
        
        if (self.nodes[id].value > 0){
            // not allow duplicate key
            return;
        }

        uint leftId = findPrevByValue(self, value);
        uint rightId = next(self, leftId);

        // update prev item link
        self.keys[leftId] = id;

        // update current item
        self.keys[id] = rightId;        
        self.nodes[id] = Item(id, value, leftId);   

        // update max item
        if (rightId == None) {
            self.maxId = id;
        }        
        else {
            // upate next item link
            self.nodes[rightId].leftId = id;   
        }

        // update counts
        self.count ++;                    
    }

    function remove(SortedMap storage self, uint id) internal {

        if (exists(self, id)) {

            // get left and right
            uint leftId = prev(self, id);
            uint rightId = next(self, id);

            self.keys[leftId] = rightId;

            if (rightId > 0) {
                self.nodes[rightId].leftId = leftId;
            }

            // update max item
            if (rightId == None) {
                self.maxId = leftId;
            }   

            delete self.nodes[id]; // remove value
            delete self.keys[id]; // remove key

            self.count --;
        }
    }

    function exists(SortedMap storage self, uint id) internal view returns(bool) {
        require(id > 0);
        return self.nodes[id].value > 0;
    }

    function first(SortedMap storage self) internal view returns(uint) {
        return next(self, 0);
    }
       
    function last(SortedMap storage self) internal view returns(uint) {
        return self.maxId;
    }

    function size(SortedMap storage self) internal view returns(uint) {
        return self.count;
    }

    function findPrevByValue(SortedMap storage self, uint target) internal view returns(uint256) {  

        require(target > 0, "require target > 0");

        if (self.count == 0) return None;
        
        // try to match last item
        uint lastId = self.maxId;        
        uint lastValue = self.nodes[lastId].value;
        if (target >= lastValue) {            
            return lastId; // return max
        }

        // try to match first item
        uint firstId = first(self);
        uint firsValue = self.nodes[firstId].value;
        if (target <= firsValue) {
            return None;  // return head
        }

        uint mid = (firsValue + lastValue) >> 1;

        if (target >= mid) {
            // find prev item step by step (right to left)
            uint curentId = lastId;
            while (curentId > 0) {
                curentId = prev(self, curentId);
                if (curentId > 0 && target >= self.nodes[curentId].value) {
                    return curentId;
                }        
            }
        }
        else {
            // find next item step by step (left to right)
            uint curentId = firstId;
            while (curentId > 0) { // the lastId node is zero
                curentId = next(self, curentId);
                if (curentId > 0 && target >= self.nodes[curentId].value) {
                    return curentId;
                }        
            }
        }

        return None;
    }

    function prev(SortedMap storage self, uint id) internal view returns(uint256) {
        if (exists(self, id)) {
            return self.nodes[id].leftId;
        }  
        return None;     
    }

    function next(SortedMap storage self, uint id) internal view returns(uint256) {
        uint nextId = self.keys[id];
        return nextId;
    }  

    function get(SortedMap storage self, uint id) internal view returns(Item memory) {
        return self.nodes[id];
    }  

    function top(SortedMap storage self, uint num) internal view returns(uint[] memory){        
        if(num > self.count) {
            num = self.count;
        }
        if (num < 1) {
            return new uint[](0);
        }

        uint[] memory items = new uint[](num);

        uint curentId = first(self);
        for(uint i=0; i < num; i++) {            
            if (curentId > 0) {
                items[i] = curentId;
            }   
            curentId = next(self, curentId);
        }
        
        return items;
    }
}