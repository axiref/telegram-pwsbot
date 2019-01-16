import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
const adapter = new FileSync('db.json')
const db = low(adapter)

db.defaults({ re: [], blacklist: [], subs: []}).write();

class Db
{
  /**
   * 获取DB对象
   * @return {lowdb}
   */
  get db () {
    return db;
  };
  /**
   * 创建一个DB对象
   * @param {String} table 表名
   */
  constructor (table) {
    this.table = table;
  };
  /**
   * 添加一行记录
   * @param {Object} data 参数
   */
  add (data) {
    db.get(this.table).push(data).write();
    return data;
  };
  /**
   * 是否存在某记录
   * @param  {[type]}  data [description]
   * @return {Boolean}      [description]
   */
  has (data) {
    return this.get(data) ? true : false;
  };
  /**
   * 获取符合条件的记录
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  get (data) {
    let row = db.get(this.table).filter(data).value();
    if (Array.isArray(row) && row.length === 0) {
      return null;
    }
    return row;
  };
  /**
   * 查找一个记录
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  one (data) {
    return db.get(this.table).find(data).value();
  };
  /**
   * 删除符合条件的记录
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  del (data) {
    db.get(this.table).remove(data).write();
  };
  /**
   * 更新符合条件的记录
   * @param  {Object} condition 查询条件
   * @param  {Object} data      要更新的数据
   * @return {[type]}           [description]
   */
  update (condition, data) {
    return db.get(this.table).find(condition).assign(data).write()
  };
}

export default Db;
