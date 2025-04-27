(function($) {
	$.fn.databind = function(data, options) {
	
		const settings = $.extend({
			escape: true,
			quote: '"',
		}, options);
		
		function escapeHtml(str) {
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
		
//		function getValue(data, path) {  // 데이터 접근 (e.g. 'user.name' → obj.user.name)
//			return path.split('.').reduce((o, k) => o?.[k], data) ?? '';
//		};
		function getValue(context, path) {
			if (!path) return undefined;
			const keys = path.split('.');
			let value = context;
			for (let key of keys) {
				if (value == null) return undefined;  // 안전하게 중간 null 체크
				value = value[key];
			}
			return value;
		};
		
		function evaluate(expression, context) {
			try {
				if (expression.indexOf('.')) {
					
				}
				return (new Function("with(this) { return " + expression + "}")).call(context);  // expression.indexOf('.')>-1 ? getValue(expression, context) : 
			} catch (e) {
				console.error('Evaluation error:', expression, e);
				return undefined;
			}
		};
		
		function parseAttributes(attrStr) {
			const attrs = {};
			attrStr.replace(/(\w+)="([^"]*)"/g, (_, key, val) => {
				attrs[key] = val;
			});
			return attrs;
		};
		
		function removePrefixSuffix(text, prefixRegex, suffixRegex) {
			return text
				.replace(new RegExp('^\\s*(' + prefixRegex + ')\\b'  , 'i'), '')
				.replace(new RegExp('\\b('   + suffixRegex + ')\\s*$', 'i'), '');
		};
		
		function processIf(template, context) {
			return template.replace(/<if\s+test="([^"]+)">([\s\S]*?)<\/if>/g, (match, testExpr, inner) => {
				const expr = testExpr.replace(/([a-zA-Z_][\w\.]*)/g, (_, key) => {
					if (key.includes('.')) {
						return `getValue(context, "${key}")`;
					}
					return `context.${key}`;
				});
				try {
					//if (eval(expr)) {
					if (new Function("with(this) { return " + expr + "}")) {
						return inner;
					} else {
						return '';
					}
				} catch (e) {
					console.error('Error evaluating test:', testExpr, e);
					return '';
				}
			});
		};
		
		function processTemplate(template, context) {
			template = template.replace(/<!--[\s\S]*?-->/g, '');  // 주석 제거
			
			// <choose><when><otherwise>
			template = template.replace(/<choose>([\s\S]*?)<\/choose>/gi, (match, inner) => {
				let result = '';
				let whenMatched = false;
				inner.replace(/<when\s+test="([^"]+)">([\s\S]*?)<\/when>/gi, (m, test, content) => {
					if (!whenMatched && evaluate(test, context)) {
						result = processTemplate(content, context);
						whenMatched = true;
					}
				});
				if (!whenMatched) {
					const otherwiseMatch = inner.match(/<otherwise>([\s\S]*?)<\/otherwise>/i);
					if (otherwiseMatch) {
						result = processTemplate(otherwiseMatch[1], context);
					}
				}
				return result;
			});
			
			
			// <foreach>
			template = template.replace(/<foreach\s+([^>]*)>([\s\S]*?)<\/foreach>/gi, (match, attrStr, inner) => {
				const attrs = parseAttributes(attrStr);
				const collection = evaluate(attrs.collection, context);
				const itemName = attrs.item || 'item';
				const indexName = attrs.index || 'index';
				const separator = attrs.separator || '';
				const open = attrs.open || '';
				const close = attrs.close || '';
				
				if (!Array.isArray(collection)) return '';
				
				//result = processIf(result, subContext);  // 여기서 바로 <if> 내부 처리 추가!!
				
				const parts = collection.map((item, idx) => {
					const localContext = Object.assign({}, context);
					localContext[itemName] = item;
					localContext[indexName] = idx;
					
					return processTemplate(inner, localContext);
				});
				
				return open + parts.join(separator) + close;
			});
			
			// <if test="">
			template = template.replace(/<if\s+test="([^"]+)">([\s\S]*?)<\/if>/gi, (match, testExpr, inner) => {
				return evaluate(testExpr, context) ? processTemplate(inner, context) : '';
			});
			
//			// <where>
//			template = template.replace(/<where>([\s\S]*?)<\/where>/gi, (match, inner) => {
//				let processed = processTemplate(inner, context).trim();
//				processed = processed.replace(/^(AND|OR)\s+/i, '').replace(/\s+(AND|OR)$/i, '');
//				return processed ? 'WHERE ' + processed : '';
//			});
//			
//			// <set>
//			template = template.replace(/<set>([\s\S]*?)<\/set>/gi, (match, inner) => {
//				let processed = processTemplate(inner, context).trim();
//				processed = processed.replace(/,(\s*?)$/, '');
//				return processed ? 'SET ' + processed : '';
//			});
//			
//			// <trim>
//			template = template.replace(/<trim\s+([^>]*)>([\s\S]*?)<\/trim>/gi, (match, attrStr, inner) => {
//				const attrs = parseAttributes(attrStr);
//				let processed = processTemplate(inner, context).trim();
//				
//				if (attrs.prefixOverrides) {
//					processed = processed.replace(new RegExp('^(' + attrs.prefixOverrides.split('|').join('|') + ')\\s*', 'i'), '');
//				}
//				if (attrs.suffixOverrides) {
//					processed = processed.replace(new RegExp('(' + attrs.suffixOverrides.split('|').join('|') + ')\\s*$', 'i'), '');
//				}
//				
//				return (attrs.prefix || '') + processed + (attrs.suffix || '');
//			});
			
			// ${} 직접 바인딩
			template = template.replace(/\$\{([^}]+)\}/g, (match, expr) => {
				const value = evaluate(expr.trim(), context);
				return value != null ? value : '';
			});
			
			// #{} escape + 따옴표 감싸기
			template = template.replace(/#\{([^}]+)\}/g, (match, expr) => {
				const value = evaluate(expr.trim(), context);
				if (value == null) return settings.quote + settings.quote;
				const escaped = settings.escape ? escapeHtml(value) : value;
				return settings.quote + escaped + settings.quote;
			});
			
			return template;
		};
		
		return this.each(function() {
			const $t = $(this), tag = $t.prop('tagName').toLowerCase();
			if (['table'].includes(tag)) {
				const template = $t.find('.tbody-template').html();
				const rendered = processTemplate(template, data);
				$t.find('tbody').empty().html(rendered);
			} else {
				const template = $t.find('.template').html();
				const rendered = processTemplate(template, data);
				$t.empty().html(rendered);
			}
		});
	};
})(jQuery);
