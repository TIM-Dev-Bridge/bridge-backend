const isEmail = (email) => {
  const regEx = /^((([!#$%&'*+\-/=?^_`{|}~\w])|([!#$%&'*+\-/=?^_`{|}~\w][!#$%&'*+\-/=?^_`{|}~\.\w]{0,}[!#$%&'*+\-/=?^_`{|}~\w]))[@]\w+([-.]\w+)*\.\w+([-.]\w+)*)$/;
  if (email.match(regEx)) return true;
  else return false;
};

const validatePassword = (password) => {
  const passwordErrors = {}
  if (
    !data.password.match(/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).*$/)) {
      passwordErrors.format_password = "Password should include capital letter, small Letter, number and special character";
  }
  if (
    !data.password.match(/^(?!.*[^a-zA-Z0-9 !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).*$/)) {
      passwordErrors.invalid_charactor_password = "Password should not contain invalid character";
  }
  if (data.password.match(/^.{8,}$/)) {
    passwordErrors.password_short = "Password should contain at least 8 characters";
  }
  if (data.password.match(/^.{,32}$/)) {
    passwordErrors.password_long = "Password should contain less than 32 character";
  }
  return {
    passwordErrors,
    valid: Object.keys(passwordErrors).length === 0 ? true : false,
  };
}

exports.validateSignupData = (data) => {
  let errors = {};
  //Validate user input
  if (
    !(
      data.first_name &&
      data.last_name &&
      data.display_name &&
      data.birth_date &&
      data.email &&
      data.username &&
      data.password
    )
  ) {
    errors.required = "All input is required";
  }
  //TS_SU_06-07
  if (!data.first_name.match(/^[A-Za-z]+$/)) {
    errors.first_name = "Firstname only accept alphabet";
  }
  //TS_SU_09-10
  if (!data.last_name.match(/^[A-Za-z]+$/)) {
    errors.last_name = "Lastname only accept alphabet";
  }
  //TS_SU_12-14
  if (!isEmail(data.email)) {
    errors.email = "Invalid email format";
  }
  //TC_SU_16
  if (!data.display_name.match(/^.{5,}$/)) {
    errors.display_name = "Display Name should contain at least 5 characters";
  }
  //TC_SU_17
  if (!data.display_name.match(/^.{,16}$/)) {
    errors.display_name = "Display Name should contain less than 16 characters";
  }

  //TC_SU_22
  // if (
  //   !data.password.match(/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).*$/)) {
  //   errors.format_password = "Password should include capital letter, small Letter, number and special character";
  // }
  //TC_SU_XX {Pending}
  // if (
  //   !data.password.match(/^(?!.*[^a-zA-Z0-9 !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).*$/)) {
  //   errors.invalid_charactor_password = "Password should not contain invalid character";
  // }
  //TC_SU_23
  // if (data.password.match(/^.{8,}$/)) {
  //   errors.password_short = "Password should contain at least 8 characters";
  // }
  //TC_SU_24
  // if (data.password.match(/^.{,32}$/)) {
  //   errors.password_long = "Password should contain less than 32 character";
  // }

  errors = {...errors, ...(validatePassword(data.password).passwordErrors)}

  //TC_SU_25 match with confirmed password
  if (data.password != data.confirm_password) {
    errors.confirm_password = "Password do not match";
  }
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

exports.validateLoginData = (data) => {
  let errors = {};
  // TC_LI_01
  if (!data.email) errors.email = "Must not be empty";
  if (!data.password) errors.password = "Must not be empty";
  // TC_LI_05-07
  if (!isEmail(data.email)) {
    errors.format_email = "Invalid email format";
  }
  // TC_LI_10-11
  if (!validatePassword(data.password).valid) {
    errors.format_password = "Invalid Password";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};
