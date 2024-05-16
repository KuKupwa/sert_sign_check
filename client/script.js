const SERVER_URL = "https://kukupwa.ntcad.ru/api/";
const submitButton = document.getElementById("buttonCheck");

const rootCert = document.getElementById("root-cert");
const rootCertLabel = document.getElementById("root-cert-label");
const signature = document.getElementById("signature");
const signatureLabel = document.getElementById("signature-label");
const signedFile = document.getElementById("signed-file");
const signedFileLabel = document.getElementById("signed-file-label");

let signedType = "ATT";
// "DET"
console.log(signedType);
const contentOutput = document.getElementById("content-output");

const appendMessage = (message, type) => {
	const messageElement = document.createElement("div");
	messageElement.textContent = message;
	switch (type) {
		case "GOOD":
			messageElement.style.color = "green";
			break;
		case "BAD":
			messageElement.style.color = "red";
			break;
		default:
			messageElement.style.color = "gray";
	}
	contentOutput.appendChild(messageElement);
};

rootCert.addEventListener("change", () => {
	itemLabelChange(rootCert, rootCertLabel);
});
signature.addEventListener("change", () => {
	itemLabelChange(signature, signatureLabel);
});
signedFile.addEventListener("change", () => {
	itemLabelChange(signedFile, signedFileLabel);
});

const changedSignType = () => {
	const att = document.getElementById("att");
	const det = document.getElementById("det");

	if (signedType === "ATT") {
		att.classList.remove("activeS");
		det.classList.add("activeS");
	} else {
		det.classList.remove("activeS");
		att.classList.add("activeS");
	}
};

const attClick = () => {
	signedType = "DET";
	changedSignType();
};

const detClick = () => {
	signedType = "ATT";
	changedSignType();
};

const itemLabelChange = (element, label) => {
	const fileName = element.value.split("\\").pop();
	label.textContent = fileName || "Выбрать файл";
	disabledButton();
};

const disabledButton = () => {
	if (
		rootCert.value !== "" &&
		signature.value !== "" &&
		signedFile.value !== ""
	) {
		submitButton.removeAttribute("disabled");
	} else {
		submitButton.setAttribute("disabled", "disabled");
	}
};

const verifyCert = () => {
	appendMessage("Проверка сертификата началась", "info");
	const formData = new FormData();
	formData.append("files", rootCert.files[0], "converted.pem");

	const requestOptions = {
		method: "POST",
		body: formData,
		redirect: "follow",
	};

	fetch(`${SERVER_URL}validateCRL/`, requestOptions)
		.then((response) => response.json())
		.then(notifMessageCRL)
		.catch((error) => {
			console.error(error);
			appendMessage(
				"Произошла ошибка. Удостоверьтесь в валидности данных.",
				"BAD",
			);
		});
};

const notifMessageCRL = (res) => {
	switch (res.message) {
		case "Revoked":
			appendMessage("Сертификат отозван", "BAD");
			break;
		case "Ok":
			appendMessage("Сертификат не отозван", "GOOD");
			break;
		case "CRL Extension Not Found":
			appendMessage("По данному сертификату не найден CRL", "BAD");
			break;
		default:
			appendMessage("Переданные данные содержат ошибку", "BAD");
			break;
	}
	verifyPKCS("DET"); // Переместить вызов функции проверки подписи сюда
};

const verifyPKCS = () => {
	appendMessage("Проверка валидности подписи:", "info");

	if (signedType == "ATT") {
		const formdata = new FormData();
		formdata.append("signed_file", signature.files[0], "UserAttached.p7m");
		formdata.append("root_certificate", rootCert.files[0], "CAchain.pem");
		formdata.append("content_file", signedFile.files[0], "User.txt");

		const requestOptions = {
			method: "POST",
			body: formdata,
			redirect: "follow",
		};

		fetch(`${SERVER_URL}verifyPKCS/`, requestOptions)
			.then((response) => response.json())
			.then((data) => notifMessageVerify(data.message))
			.catch((error) => {
				console.error(error);
				appendMessage(
					"Произошла ошибка. Удостоверьтесь в валидности данных.",
					"BAD",
				);
			});
	} else {
		formdata.append("signed_file", signature.files[0], "UserAttached.p7m");
		formdata.append("root_certificate", rootCert.files[0], "CAchain.pem");

		const requestOptions = {
			method: "POST",
			body: formdata,
			redirect: "follow",
		};

		fetch(`${SERVER_URL}verifyPKCS/`, requestOptions)
			.then((response) => response.json())
			.then((data) => notifMessageVerify(data.message))
			.catch((error) => {
				console.error(error);
				appendMessage(
					"Произошла ошибка. Удостоверьтесь в валидности данных.",
					"BAD",
				);
			});
	}
};

const notifMessageVerify = (res) => {
	switch (res) {
		case "Failed":
			appendMessage("Подпись недействительна", "BAD");
			break;
		case "Verified":
			appendMessage("Подпись действительна", "GOOD");
			break;
	}
};

document.getElementById("buttonCheck").addEventListener("click", verifyCert);
document.getElementById("clean").addEventListener("click", () => {
	contentOutput.innerText = "";
});
document.getElementById("att").addEventListener("click", attClick);
document.getElementById("det").addEventListener("click", detClick);
