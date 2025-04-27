class Ajax {
	constructor(baseURL='') {
		this.baseURL = baseURL;
		this.controller = null;
		
		this.indicator = '_indicator_';
		
		// ESC 키 눌렀을 때 요청 중단
		document.addEventListener('keydown', e=>{
			if (e.key === 'Escape') {
				this.abort('Ajax 요청 사용자 취소');
			}
		});
	};
	
	showIndicator (isShow=false) {
		this.obj_indicator = document.getElementById(this.indicator);
		if (!this.obj_indicator) {
			let div = document.createElement('div');
			div.id        = this.indicator;
			div.className = 'loading-overlay';  // loading-spinner';
			
			let indi = {
				top : (window.outerHeight + window.scrollY) / 2 - 160 +'px',
				left: (window.outerWidth  + window.scrollX) / 2 - 40  +'px',
			};
			div.innerHTML = ''
				+ '<div style="position: absolute; top:'+ indi.top +'; left:'+ indi.left +';">'
				+ '<div class="spinner" ></div>'
				+ '<div style="text-align:center; color:white; margin-top:10px;">🔄 로딩중...</div>'
				+ '</div>'
			;  // 🔄 로딩중..';
			document.body.appendChild(div);
			this.obj_indicator = document.getElementById(this.indicator);
		}
		
		this.obj_indicator.style.display = isShow ? 'block' : 'none';
	};
	
	abort (s) {
		if (this.controller) {
			try { this.controller.abort({ name: 'UserAbort', message: s }); } catch (e) {}
			this.controller = null;
			this.showIndicator(false);
			//console.warn('[Ajax] 요청이 ESC 키로 중단되었습니다.');
		}
	};
	
	async request (method, url, data = null, headers = {}) {
		this.showIndicator(true);
		this.controller = new AbortController();
		const signal = this.controller.signal;
		
		const config = {
			method: method,
			headers: {
				'Content-Type': 'application/json',
				'Accept'      : 'application/json',
				...headers
			},
			signal,
		};

		if (data && method !== 'GET') {
			config.body = JSON.stringify(data);
		}

		const finalUrl = method === 'GET' && data
			? `${this.baseURL}${url}?${new URLSearchParams(data).toString()}`
			: `${this.baseURL}${url}`;

		try {
			const response = await fetch(finalUrl, config);
			if (!response.ok) {
				const errMsg = await response.text();
				throw new Error(`HTTP ${response.status}: ${errMsg}`);
			}
			const contentType = response.headers.get('Content-Type') || '';
			if (contentType.includes('application/json')) {
				return await response.json();
			} else {
				return await response.text();
			}
		} catch (err) {
			if (err.name==='UserAbort') {
				console.log(url +' : '+ err.message);
			} else {
				throw err;  // console.error('[Error]', err);
			}
		} finally {
			this.showIndicator(false);
		}
	};

	get (url, params = {}, headers = {}) {
		return this.request('GET', url, params, headers);
	};

	post (url, data = {}, headers = {}) {
		return this.request('POST', url, data, headers);
	};

	put (url, data = {}, headers = {}) {
		return this.request('PUT', url, data, headers);
	};

	delete (url, data = {}, headers = {}) {
		return this.request('DELETE', url, data, headers);
	};
};
window.Ajax = Ajax;  // 전역 사용을 위한 export
const $ajax = new Ajax();
