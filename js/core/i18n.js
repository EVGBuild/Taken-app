const LUMI_TRANSLATIONS={
  nl:{
    'status.open':'Open','status.waiting':'Wachten op','status.later':'Later','status.done':'Gedaan',
    'waiting.forPrompt':'Waar/wie wacht je op? (optioneel)','waiting.followUpPrompt':'Wanneer wil je dit weer zien? Vul een datum in als JJJJ-MM-DD, of laat leeg.','waiting.since':'Wacht sinds {date}','waiting.noResponse':'Nog geen reactie van {name}','waiting.generic':'Wachten op opvolging','waiting.keep':'Nog wachten','waiting.followUp':'Opvolgen','waiting.set':'Wachten op',
    'later.set':'Later','later.prompt':'Wanneer wil je dit weer zien? Vul een datum in als JJJJ-MM-DD, of laat leeg voor geen datum.','later.noDate':'Geen datum','later.resurfaced':'Teruggebracht','later.resurface':'Terugbrengen',
    'date.planned':'Gepland','date.deadline':'Deadline','date.resurface':'Terugbrengen','date.invalid':'Gebruik een geldige datum in de vorm JJJJ-MM-DD.',
    'recurrence.afterCompletion':'Na voltooiing','recurrence.daily':'Dagelijks','recurrence.weekly':'Wekelijks','recurrence.monthly':'Maandelijks','recurrence.quarterly':'Per kwartaal','recurrence.halfYearly':'Halfjaarlijks','recurrence.yearly':'Jaarlijks','recurrence.every':'Iedere {interval} {unit}','recurrence.day.one':'dag','recurrence.day.many':'dagen','recurrence.week.one':'week','recurrence.week.many':'weken','recurrence.month.one':'maand','recurrence.month.many':'maanden','recurrence.year.one':'jaar','recurrence.year.many':'jaar',
    'reason.energyFit':'Past bij je energie','reason.lowEnergy':'Weinig energie','reason.deadline':'Deadline nadert','reason.important':'Binnenkort belangrijk','reason.lowResistance':'Weinig weerstand','reason.resurfaced':'Opnieuw relevant','reason.duration':'± {minutes} min',
    'menu.edit':'Bewerken','menu.delete':'Verwijderen','menu.cancel':'Annuleren'
  },
  en:{
    'status.open':'Open','status.waiting':'Waiting for','status.later':'Later','status.done':'Done',
    'waiting.forPrompt':'Who or what are you waiting for? (optional)','waiting.followUpPrompt':'When should this return? Enter YYYY-MM-DD or leave blank.','waiting.since':'Waiting since {date}','waiting.noResponse':'No response from {name} yet','waiting.generic':'Waiting for follow-up','waiting.keep':'Keep waiting','waiting.followUp':'Follow up','waiting.set':'Waiting for',
    'later.set':'Later','later.prompt':'When should this return? Enter YYYY-MM-DD or leave blank for no date.','later.noDate':'No date','later.resurfaced':'Resurfaced','later.resurface':'Resurface',
    'date.planned':'Planned','date.deadline':'Deadline','date.resurface':'Resurface','date.invalid':'Use a valid date in the form YYYY-MM-DD.',
    'recurrence.afterCompletion':'After completion','recurrence.daily':'Daily','recurrence.weekly':'Weekly','recurrence.monthly':'Monthly','recurrence.quarterly':'Quarterly','recurrence.halfYearly':'Every six months','recurrence.yearly':'Yearly','recurrence.every':'Every {interval} {unit}','recurrence.day.one':'day','recurrence.day.many':'days','recurrence.week.one':'week','recurrence.week.many':'weeks','recurrence.month.one':'month','recurrence.month.many':'months','recurrence.year.one':'year','recurrence.year.many':'years',
    'reason.energyFit':'Fits your energy','reason.lowEnergy':'Low energy','reason.deadline':'Deadline approaching','reason.important':'Important soon','reason.lowResistance':'Low resistance','reason.resurfaced':'Relevant again','reason.duration':'± {minutes} min',
    'menu.edit':'Edit','menu.delete':'Delete','menu.cancel':'Cancel'
  }
};
function lumiLocale(){const code=(document.documentElement.lang||navigator.language||'nl').toLowerCase();return code.startsWith('en')?'en':'nl'}
function t(key,values={}){const locale=lumiLocale(),template=LUMI_TRANSLATIONS[locale][key]??LUMI_TRANSLATIONS.nl[key]??key;return template.replace(/\{(\w+)\}/g,(_,name)=>values[name]??'')}
