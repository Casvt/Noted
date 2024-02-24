const setting_inputs = {
	allow_new_accounts: document.querySelector('#allow-new-accounts-input'),
	login_time: document.querySelector('#login-time-input'),
	login_time_reset: document.querySelector('#login-time-reset-input')
};

const user_inputs = {
	username: document.querySelector('#new-username-input'),
	password: document.querySelector('#new-password-input')
};

const power_buttons = {
	restart: document.querySelector('#restart-button'),
	shutdown: document.querySelector('#shutdown-button')
};

function checkLogin() {
	fetch(`${url_prefix}/api/auth/status?api_key=${api_key}`)
	.then(response => {
		if (!response.ok) return Promise.reject(response.status)
		return response.json();
	})
	.then(json => {
		if (!json.result.admin)
			window.location.href = `${url_prefix}/reminders`;
	})
	.catch(e => {
		if (e === 401)
			window.location.href = `${url_prefix}/`;
		else
			console.log(e);
	});
};

function loadSettings() {
	fetch(`${url_prefix}/api/settings`)
	.then(response => response.json())
	.then(json => {
		setting_inputs.allow_new_accounts.checked = json.result.allow_new_accounts;
		setting_inputs.login_time.value = Math.round(json.result.login_time / 60);
		setting_inputs.login_time_reset.value = json.result.login_time_reset.toString();
	});
};

function submitSettings() {
	const data = {
		'allow_new_accounts': setting_inputs.allow_new_accounts.checked,
		'login_time': setting_inputs.login_time.value * 60,
		'login_time_reset': setting_inputs.login_time_reset.value === 'true'
	};
	fetch(`${url_prefix}/api/admin/settings?api_key=${api_key}`, {
		'method': 'PUT',
		'headers': {'Content-Type': 'application/json'},
		'body': JSON.stringify(data)
	})
	.then(response => response.json())
	.then(json => {
		if (json.error !== null)
			return Promise.reject(json)
	})
	.catch(json => {
		if (['ApiKeyInvalid', 'ApiKeyExpired'].includes(json.error))
			window.location.href = `${url_prefix}/`;
	});
};

function toggleAddUser() {
	const el = document.querySelector('#add-user-row');
	if (el.classList.contains('hidden')) {
		// Show row
		user_inputs.username.value = '';
		user_inputs.password.value = '';
		el.classList.remove('hidden');
	} else {
		// Hide row
		el.classList.add('hidden');
	};
};

function addUser() {
	user_inputs.username.classList.remove('error-input');
	user_inputs.username.title = '';
	const data = {
		'username': user_inputs.username.value,
		'password': user_inputs.password.value
	};
	fetch(`${url_prefix}/api/admin/users?api_key=${api_key}`, {
		'method': 'POST',
		'headers': {'Content-Type': 'application/json'},
		'body': JSON.stringify(data)
	})
	.then(response => response.json())
	.then(json => {
		if (json.error !== null)
			return Promise.reject(json.error);
		toggleAddUser();
		loadUsers();
	})
	.catch(e => {
		if (e === "UsernameTaken") {
			user_inputs.username.classList.add('error-input');
			user_inputs.username.title = 'Username already taken';

		} else if (e === "UsernameInvalid") {
			user_inputs.username.classList.add('error-input');
			user_inputs.username.title = 'Username contains invalid characters';

		} else
			console.log(e);
	});
};

function editUser(id) {
	const new_password = document.querySelector(
		`#user-table tr[data-id="${id}"] input`
	).value;
	fetch(`${url_prefix}/api/admin/users/${id}?api_key=${api_key}`, {
		'method': 'PUT',
		'headers': {'Content-Type': 'application/json'},
		'body': JSON.stringify({'new_password': new_password})
	})
	.then(response => loadUsers());
};

function deleteUser(id) {
	document.querySelector(`#user-table tr[data-id="${id}"]`).remove();
	fetch(`${url_prefix}/api/admin/users/${id}?api_key=${api_key}`, {
		'method': 'DELETE'
	});
};

function loadUsers() {
	const table = document.querySelector('#user-list');
	table.innerHTML = '';
	fetch(`${url_prefix}/api/admin/users?api_key=${api_key}`)
	.then(response => response.json())
	.then(json => {
		json.result.forEach(user => {
			const entry = document.createElement('tr');
			entry.dataset.id = user.id;

			const username = document.createElement('td');
			username.innerText = user.username;
			entry.appendChild(username);

			const password = document.createElement('td');
			const new_password_form = document.createElement('form');
			new_password_form.classList.add('hidden');
			new_password_form.action = `javascript:editUser(${user.id})`;
			const new_password = document.createElement('input');
			new_password.type = 'password';
			new_password.placeholder = 'New password';
			new_password_form.appendChild(new_password);
			password.appendChild(new_password_form);
			entry.appendChild(password);

			const actions = document.createElement('td');
			entry.appendChild(actions);

			const edit_user = document.createElement('button');
			edit_user.onclick = e => e
				.currentTarget
				.parentNode
				.previousSibling
				.querySelector('form')
				.classList
				.toggle('hidden');
			edit_user.innerHTML = Icons.edit;
			actions.appendChild(edit_user);

			if (user.username !== 'admin') {
				const delete_user = document.createElement('button');
				delete_user.onclick = e => deleteUser(user.id);
				delete_user.innerHTML = Icons.delete;
				actions.appendChild(delete_user);
			};

			table.appendChild(entry);
		});
	});
};

function restart_app() {
	power_buttons.restart.innerText = 'Restarting...';
	fetch(`${url_prefix}/api/admin/restart?api_key=${api_key}`, {
		method: "POST"
	})
	.then(response =>
		setTimeout(
			() => window.location.reload(),
			1000
		)
	);
};

function shutdown_app() {
	power_buttons.shutdown.innerText = 'Shutting down...';
	fetch(`${url_prefix}/api/admin/shutdown?api_key=${api_key}`, {
		method: "POST"
	})
	.then(response =>
		setTimeout(
			() => window.location.reload(),
			1000
		)
	);
};

// code run on load

checkLogin();
loadSettings();
loadUsers();

document.querySelector('#logout-button').onclick = e => logout();
document.querySelector('#settings-form').action = 'javascript:submitSettings();';
document.querySelector('#add-user-button').onclick = e => toggleAddUser();
document.querySelector('#add-user-form').action = 'javascript:addUser()';
document.querySelector('#download-db-button').onclick = e => 
	window.location.href = `${url_prefix}/api/admin/database?api_key=${api_key}`;
power_buttons.restart.onclick = e => restart_app();
power_buttons.shutdown.onclick = e => shutdown_app();