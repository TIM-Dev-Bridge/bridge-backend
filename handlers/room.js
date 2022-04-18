exports.nameInRoom = (idInRoom, users) => {
  let name = idInRoom.map((id) => {
    let [{ username }] = users.filter((user) => user.socket_id == id);
    return username;
  });
  return name;
};
exports.accessInRoom = (idInRoom, users) => {
  let permission = idInRoom.map((id) => {
    let [{ access }] = users.filter((user) => user.socket_id == id);
    return access;
  });
  return permission;
};
