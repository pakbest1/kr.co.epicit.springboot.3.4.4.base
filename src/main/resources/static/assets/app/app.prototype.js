
$('[data-include]').each((_,e)=>{
	$(e).load(e.dataset.include??'');
});