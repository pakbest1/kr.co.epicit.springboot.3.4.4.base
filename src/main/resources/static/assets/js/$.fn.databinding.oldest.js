
// V1
(function($){
	
	$.databind=function(s,d){
		return s.replace(/\$\{(\w+)\}/g,(i,f)=>d[f]??'');
	};
	
	$.fn.renderTemplate = function(template, data) {
		function escapeHtml(str) {  // XSS 등 방지를 위한 escape
			return String(str).replace(/[&<>"']/g, s => ({
				'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
			})[s]);
		}
		
		function getValue(obj, path) {  // 데이터 접근 (e.g. 'user.name' → obj.user.name)
			return path.split('.').reduce((o, k) => o?.[k], obj) ?? '';
		}
		
		function processVariables(str, scope) {  // ${} / #{} 처리
			return str
				.replace(/\$\{([\w.]+)\}/g, (_, key) =>     escapeHtml(getValue(scope, key))   )
				.replace(/#\{([\w.]+)\}/g , (_, key) => `"${escapeHtml(getValue(scope, key))}"`)
			;
		}
		
		function processIfBlocks(template, scope) {  // <if test="..."> 조건부 렌더링
			return template.replace(/<if\s+test="([^"]+)">([\s\S]*?)<\/if>/g, (index, condition, content) => {
				let s = '';
				try {
					const fn = new Function('with(this) { return ' + condition + '; }');
					s = fn.call(scope) ? content : '';
				} catch (e) {}
				return s;
			});
		}
		
		function processForeach(template, scope) {  // <foreach ...> 반복 처리
			return template.replace(/<foreach\s+index="(\w+)"\s+collection="(\w+)"\s+item="(\w+)"(?:\s+separator="([^"]*)")?(?:\s+open="([^"]*)")?(?:\s+close="([^"]*)")?>\s*([\s\S]*?)\s*<\/foreach>/g,
					(_, index, collection, item, separator='', open='', close='', inner) => {
				const items = scope[collection] || [];
				const results = items.map(it => processVariables(inner, { [item]: it }));
				return open + results.join(separator) + close;
			});
		}
		
		function render(tmpl, data) {  // 전체 처리 흐름
			let result = tmpl;
			if (result&&result.indexOf('<foreach ')>-1) { result = processForeach (result, data); }
			if (result&&result.indexOf('<if '     )>-1) { result = processIfBlocks(result, data); }
			result = processVariables(result, data);
			return result;
		}
		
		return render(template, data);
	};
	
	$.fn.render = function(data) {
		let $t=$(this), tag=$t.prop('tagName').toLowerCase();  console.log('$t.');
		if (['table'].includes(tag)) {
			//let theadTmpl=$t.find('thead-template') thead=$.render;
			//let tfootTmpl=$t.find('tfoot-template');
			let tbodyTmpl=$t.find('.tbody-template').html(), tbody=$.fn.renderTemplate(tbodyTmpl, data);
			
			$t.find('tbody').empty().html(tbody);
		}
		return this;
	};
	
})(jQuery);

// V2
(function($) {
	$.fn.renderTemplate = function(template, data) {
		const escapeHtml = function(str) {
			if (typeof str !== 'string') return str;
			return str.replace(/[&<>"'`=\/]/g, function(s) {
				return ({
					'&': '&amp;',
					'<': '&lt;',
					'>': '&gt;',
					'"': '&quot;',
					"'": '&#39;',
					'`': '&#x60;',
					'=': '&#x3D;',
					'/': '&#x2F;'
				})[s];
			});
		};
		const evaluate = function(expression, context) {
			try {
				return (new Function("with(this) { return " + expression + "}")).call(context);
			} catch (e) {
				console.error('Evaluation error:', expression, e);
				return false;
			}
		};
		const processTemplate = function(template, context) {
			// if 처리
			template = template.replace(/<if\s+test="([^"]+)">([\s\S]*?)<\/if>/gi, (match, testExpr, inner) => {
				return evaluate(testExpr, context) ? processTemplate(inner, context) : '';
			});
			// foreach 처리
			template = template.replace(/<foreach\s+([^>]*)>([\s\S]*?)<\/foreach>/gi, (match, attrStr, inner) => {
				const attrs = {};
				attrStr.replace(/(\w+)="([^"]*)"/g, (_, key, val) => attrs[key] = val);
				const collection = evaluate(attrs.collection, context) || [];
				const itemName = attrs.item || 'item';
				const indexName = attrs.index || 'index';
				const separator = attrs.separator || '';
				const open = attrs.open || '';
				const close = attrs.close || '';
				
				if (!Array.isArray(collection)) return '';
				const result = collection.map((item, idx) => {
					const localContext = Object.assign({}, context);
					localContext[itemName] = item;
					localContext[indexName] = idx;
					return processTemplate(inner, localContext);
				}).join(separator);
				
				return open + result + close;
			});
			
			// ${} 처리
			template = template.replace(/\$\{([^}]+)\}/g, (match, expr) => {
				const value = evaluate(expr.trim(), context);
				return value != null ? value : '';
			});
			
			// #{} 처리 (escape 후 따옴표)
			template = template.replace(/#\{([^}]+)\}/g, (match, expr) => {
				const value = evaluate(expr.trim(), context);
				return value != null ? `"${escapeHtml(value)}"` : '""';
			});
			
			return template;
		};
		
		return this.each(function(idx, el) {
			const $el = $(el);
			//const original = $el.html();
			const rendered = processTemplate(template, data);
			$el.html(rendered);
		});
	};
	
	$.fn.render = function(data) {
		let $t=$(this), tag=$t.prop('tagName').toLowerCase();  // console.log('$t.');
		if (['table'].includes(tag)) {
			//let theadTmpl=$t.find('thead-template') thead=$.render;
			//let tfootTmpl=$t.find('tfoot-template');
			let tbodyTmpl=$t.find('.tbody-template').html(), tbody=$.fn.renderTemplate(tbodyTmpl, data);
			
			$t.find('tbody').empty().html(tbody);
		}
		return this;
	};
})(jQuery);
