
 
 let names = ["","","","","","","","",""]
 let counts = [0,0,0,0,0,0,0,0,0]

 let emojis =  {
    stone: '🪨',
    leaf: '🍃',
    grass: '🌿',
    wood: '🪵',
    dirt: '🌱'
 }
 
 document.addEventListener('keydown', function(e) {
            const key = e.key;
            if (key >= '1' && key <= '9') {
                const slotNumber = parseInt(key);
                selectSlot(slotNumber);
            }
        });

document.querySelectorAll('.slot').forEach(slot => {
    slot.addEventListener('click', function() {
        const slotNumber = parseInt(this.dataset.slot);
        selectSlot(slotNumber);
    });
});

export function selectSlot(slotNumber) {
    document.querySelectorAll('.slot').forEach(slot => {
        slot.classList.remove('selected');
    });
            
    const selectedSlot = document.querySelector(`[data-slot="${slotNumber}"]`);
    if (selectedSlot) {
        selectedSlot.classList.add('selected');
        }
}

export function updateItemCount(slotNumber, count) {
  counts[slotNumber - 1] = count;
  const slot = document.querySelector(`[data-slot="${slotNumber}"]`);
  const countElement = slot.querySelector('.item-count');
            
  if (count > 0) {
    countElement.textContent = count;
    countElement.style.display = 'block';
  } else {
    countElement.style.display = 'none';
  }
}

export function setSlotEmoji(slotNumber, emoji) {
  const slot = document.querySelector(`[data-slot="${slotNumber}"]`);
  const emojiElement = slot.querySelector('.item-emoji');
  emojiElement.textContent = emoji;
}

export function itemCollected(name) {
    let alreadyHave = -1;
    for (let i = 0; i < 9; ++i) {
        if (names[i] == name) {
            alreadyHave = i;
        }
    }

    if (alreadyHave != -1) {
        updateItemCount(alreadyHave + 1, counts[alreadyHave] + 1)
    } else {
        for (let i = 0; i < 9; ++i) {
            if (counts[i] == 0) {
                names[i] = name;
                updateItemCount(i + 1, 1)
                setSlotEmoji(i + 1, emojis[name])
                break;
            }
        }
       
    }

}

export function placeCurrentItem() {
    let currentIndex = -1;
    document.querySelectorAll('.slot').forEach((slot, index) => {
        if (slot.classList.contains('selected')) {
            currentIndex = index;
        }
    });
    if (currentIndex == -1) {
        return null;
    }   
    const itemName = names[currentIndex];
    if (itemName) {
        counts[currentIndex]--;
        updateItemCount(currentIndex + 1, counts[currentIndex]);
        if (counts[currentIndex] <= 0) {
            names[currentIndex] = "";
            setSlotEmoji(currentIndex + 1, '');
        }
        return itemName;
    }
}