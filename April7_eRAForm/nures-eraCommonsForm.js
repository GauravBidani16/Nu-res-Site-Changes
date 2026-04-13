(function () {

  var ENDPOINT = 'https://defaulta8eec281aaa34daeac9b9a398b9215.e7.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f71aae81c2f5425183510ed0b4e6fdb1/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=mOi7tY7PGf0qNj8Noc0lntG2ZqpwFa1iwImhDo66fk0';
  var currentMode = 'new';

  function $(id) { return document.getElementById(id); }

  function setError(fieldId, hasError) {
    var field = $(fieldId);
    if (!field) return;
    field.classList.toggle('is-error', hasError);
  }

  function clearAllErrors() {
    document.querySelectorAll('.nrf-field.is-error').forEach(function (el) {
      el.classList.remove('is-error');
    });
  }

  function showStatus(message, variant) {
    var el = $('nrf-status');
    el.className = 'nrf-banner nrf-banner--' + variant;
    el.innerHTML = message;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideStatus() {
    var el = $('nrf-status');
    el.className = 'nrf-banner nrf-hidden';
    el.innerHTML = '';
  }

  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  document.addEventListener('click', function (e) {
    var opt = e.target.closest('.nrf-toggle__option');
    if (!opt) return;

    document.querySelectorAll('.nrf-toggle__option').forEach(function (o) {
      o.classList.remove('is-active');
    });
    opt.classList.add('is-active');

    var target = opt.getAttribute('data-target');
    currentMode = (target === 'nrf-section-new') ? 'new' : 'existing';

    $('nrf-section-new').classList.toggle('nrf-hidden', currentMode !== 'new');
    $('nrf-section-existing').classList.toggle('nrf-hidden', currentMode !== 'existing');

    clearAllErrors();
    hideStatus();
  });

  document.addEventListener('change', function (e) {
    if (e.target.id !== 'nrf-nihRole') return;
    $('nrf-otherRoleRow').classList.toggle('nrf-hidden', e.target.value !== 'Other');
    if (e.target.value !== 'Other') setError('field-otherRole', false);
  });

  function validateNew() {
    var ok = true;

    var firstName = $('nrf-firstName').value.trim();
    setError('field-firstName', !firstName);
    if (!firstName) ok = false;

    var lastName = $('nrf-lastName').value.trim();
    setError('field-lastName', !lastName);
    if (!lastName) ok = false;

    var username = $('nrf-username').value.trim();
    setError('field-username', username.length <= 8);
    if (username.length <= 8) ok = false;

    var email = $('nrf-email').value.trim();
    setError('field-email', !isValidEmail(email));
    if (!isValidEmail(email)) ok = false;

    var role = $('nrf-nihRole').value;
    setError('field-nihRole', !role);
    if (!role) ok = false;

    if (role === 'Other') {
      var other = $('nrf-otherRole').value.trim();
      setError('field-otherRole', !other);
      if (!other) ok = false;
    }

    return ok;
  }

  function validateExisting() {
    var ok = true;

    var username = $('nrf-existingUsername').value.trim();
    setError('field-existingUsername', username.length <= 8);
    if (username.length <= 8) ok = false;

    var existingEmail = $('nrf-existingEmail').value.trim();
    setError('field-existingEmail', !isValidEmail(existingEmail));
    if (!isValidEmail(existingEmail)) ok = false;

    var currentEmail = $('nrf-currentEmail').value.trim();
    setError('field-currentEmail', !isValidEmail(currentEmail));
    if (!isValidEmail(currentEmail)) ok = false;

    var role = $('nrf-existingNihRole').value;
    setError('field-existingNihRole', !role);
    if (!role) ok = false;

    return ok;
  }

  function buildPayload() {
    if (currentMode === 'new') {
      var role = $('nrf-nihRole').value;
      return {
        submissionType: 'new_registration',
        firstName: $('nrf-firstName').value.trim(),
        middleName: $('nrf-middleName').value.trim(),
        lastName: $('nrf-lastName').value.trim(),
        username: $('nrf-username').value.trim(),
        email: $('nrf-email').value.trim(),
        nihRole: role === 'Other' ? $('nrf-otherRole').value.trim() : role
      };
    }
    return {
      submissionType: 'affiliate_existing',
      firstName: '',
      middleName: '',
      lastName: '',
      username: $('nrf-existingUsername').value.trim(),
      email: $('nrf-existingEmail').value.trim(),
      currentEmail: $('nrf-currentEmail').value.trim(),
      nihRole: $('nrf-existingNihRole').value
    };
  }

  function resetForm() {
    ['nrf-firstName', 'nrf-middleName', 'nrf-lastName',
      'nrf-username', 'nrf-email', 'nrf-nihRole',
      'nrf-otherRole', 'nrf-existingUsername', 'nrf-existingEmail',
      'nrf-currentEmail', 'nrf-existingNihRole']
      .forEach(function (id) {
        var el = $(id);
        if (el) el.value = '';
      });
    $('nrf-otherRoleRow').classList.add('nrf-hidden');
    clearAllErrors();
  }

  document.addEventListener('click', function (e) {
    if (e.target.id !== 'nrf-submit') return;

    hideStatus();
    clearAllErrors();

    var valid = currentMode === 'new' ? validateNew() : validateExisting();
    if (!valid) return;

    var btn = $('nrf-submit');
    btn.disabled = true;
    btn.textContent = 'Submitting…';

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload())
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        showStatus(
          'Your request has been submitted. You will receive a confirmation from NIH eraCommons shortly.',
          'success'
        );
        resetForm();
      })
      .catch(function () {
        showStatus(
          'Something went wrong. Please try again or contact <strong>NU-RESHC@northeastern.edu</strong> directly.',
          'error'
        );
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = 'Submit request';
      });
  });

  document.addEventListener('click', function (e) {
    if (e.target.id !== 'nrf-clear') return;
    resetForm();
    hideStatus();
  });

})();