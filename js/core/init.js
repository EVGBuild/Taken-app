syncVdsNavIcons();
applyI18n();

// Stable delegated check-in action: avoids desktop click handlers being lost during re-rendering.
document.addEventListener('click',event=>{if(event.target.closest('#todayAdjustButton')){event.preventDefault();openCheckin()}},true);
