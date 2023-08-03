async function handleFormsparkSubmit(event) {
  event.preventDefault();
  var form = document.getElementById("contact-form");
  var data = new FormData(event.target);
  var formObj = Object.fromEntries(data.entries());
  var formJson = JSON.stringify(formObj);
  fetch(event.target.action, {
    method: form.method,
    body: formJson,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
    .then((response) => {
      if (response.ok) {
        contactAlert("success", "Thanks for your submission!");
        form.reset();
      } else if (response.status === 500) {
        contactAlert("danger", "Please complete the captcha first!");
      } else {
        contactAlert("danger", "Oops! There was a problem submitting your form");
      }
    })
    .catch((error) => {
      contactAlert("danger", "Oops! There was a problem submitting your form");
    });
}

function contactAlert(type, message) {
  var contactFormStatus = document.getElementById("contact-form-status");
  var alert = `<div class="alert alert-${type} d-flex align-items-center" role="alert">
                     <svg class="bi flex-shrink-0 me-2" role="img" aria-label="Success:">
                        <use xlink:href="#check-circle-fill" />
                    </svg>
                    <div>${message}</div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>`;
  contactFormStatus.innerHTML = alert;

  // Remove alert after 3 seconds
  setTimeout(function() {
    contactFormStatus.innerHTML = "";
  }, 3000);
}
