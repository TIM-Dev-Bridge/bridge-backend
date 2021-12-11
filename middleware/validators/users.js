const isEmail = (email) => {
  const regEx =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  else return false;
};

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
  //TC_SU_16-17
  if (!data.display_name.match(/^ (?=.{5,16})$/)) {
    errors.display_name = "Length of displayname should between 5 and 16";
  }
  //TC_SU_22
  if (
    !data.password.match(
      /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[a-zA-Z!#$%&? "])[a-zA-Z0-9!#$%&?]$/
    )
  ) {
    errors.format_password =
      "Password should include Capital Letter, small Letter, number and special character";
  }
  //TC_SU_23
  if (data.password.match(/^ (?=.{8,})$/)) {
    errors.password_short = "Password should contain at least 8 characters";
  }
  //TC_SU_24
  if (data.password.match(/^ (?=.{,32})$/)) {
    errors.password_long = "Password should contain less than 32 character";
  }
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
  //TC_LI_01
  if (!data.email) errors.email = "Must not be empty";
  if (!data.password) errors.password = "Must not be empty";
  //TC_LI_05-07
  if (!isEmail(data.email)) {
    errors.format_email = "Invalid email format";
  }
  //TC_LI_10-11
  if (!data.password.match(/^ (?=.{8,32})$/)) {
    errors.format_password = "Invalid Password";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};
