(function($) {
	$.mybatisTemplate = function(template, context = {}) {
		template = removeComment(template);  //template = template.replace(/<!--[\s\S]*?-->/g, ''); // Remove comments
		const dom = new DOMParser().parseFromString(`<root>${template}</root>`, 'application/xml').documentElement;
		
		function removeComment(s) {
			return s.replace(/<!--[\s\S]*?-->/g, ''); // Remove comments
		}
		
		function getValue(expr, ctx) {
			if (!expr) return '';
			try {
				return expr.trim().split('.').reduce((obj, key) => obj?.[key], ctx) ?? '';
			} catch {
				return '';
			}
		}
		
		function escapeValue(val) {
			return String(val).replace(/["'\\]/g, '\\$&');
		}
		
		function bindText(text, ctx) {
			return text
				.replace(/\$\{\s*([^}]+?)\s*\}/g, (_, expr) => getValue(expr, ctx))
				.replace(/#\{\s*([^}]+?)\s*\}/g, (_, expr) => `"${escapeValue(getValue(expr, ctx))}"`);
		}
		
		function evaluate(expr, ctx) {
			try {
				return new Function(...Object.keys(ctx), `return (${expr});`)(...Object.values(ctx));
			} catch {
				return false;
			}
		}
		
		function render(node, ctx) {
			if (node.nodeType === 3) return bindText(node.textContent, ctx); // Text
			
			const tag = node.nodeName;
			
			if (tag === 'if') {
				const test = node.getAttribute('test');
				return evaluate(test, ctx)
					? Array.from(node.childNodes).map(n => render(n, ctx)).join('')
					: '';
			}

			if (tag === 'foreach') {
				const items = getValue(node.getAttribute('collection'), ctx);
				const itemName = node.getAttribute('item') || 'item';
				const indexName = node.getAttribute('index') || 'index';
				const open = node.getAttribute('open') || '';
				const close = node.getAttribute('close') || '';
				const separator = node.getAttribute('separator') || '';
				
				if (!Array.isArray(items)) return '';
				
				const result = items.map((item, idx) => {
					const newCtx = { ...ctx, [itemName]: item, [indexName]: idx };
					return Array.from(node.childNodes).map(n => render(n, newCtx)).join('');
				});
				
				return open + result.join(separator) + close;
			}
			
			if (tag === 'choose') {
				const whenNodes = Array.from(node.children).filter(n => n.nodeName === 'when');
				for (const when of whenNodes) {
					if (evaluate(when.getAttribute('test'), ctx)) {
						return Array.from(when.childNodes).map(n => render(n, ctx)).join('');
					}
				}
				const otherwise = Array.from(node.children).find(n => n.nodeName === 'otherwise');
				if (otherwise) {
					return Array.from(otherwise.childNodes).map(n => render(n, ctx)).join('');
				}
				return '';
			}
			
			// Default: process children
			return Array.from(node.childNodes).map(n => render(n, ctx)).join('');
		}
	
		return render(dom, context);
	};
})(jQuery);
/*
<script>
const template = `
<choose>
  <when test="user.age >= 18">
    Adult: ${user.name}
  </when>
  <otherwise>
    Child: #{user.name}
  </otherwise>
</choose>
`;

const data = { user: { name: "Alice", age: 20 } };

const result = $.mybatisTemplate(template, data);
console.log(result); // Adult: Alice
</script>
*/