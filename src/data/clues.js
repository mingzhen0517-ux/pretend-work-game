export const CLUES = [
  { id: 'comp_email', name: '补偿方案.pdf', desc: 'HR 发来的补偿明细。你一直没点开，但数字你记得。', source: '序章邮件', tone: 'money' },
  { id: 'payslip', name: '工资流水', desc: '过去 12 个月的工资流水，证明你确实拿过这个数。', source: '银行 App', tone: 'proof' },
  { id: 'witness', name: '同事证言', desc: '老赵愿意替你作证：你确实在“上班”，只是不在公司。', source: '内推/老赵', tone: 'social' },
  { id: 'health_report', name: '体检报告', desc: '三项异常，医生建议复查。你还没告诉家里。', source: '体检中心', tone: 'health' },
  { id: 'offer', name: '面试邀约', desc: '一封还没回复的面试邀请，时间在下周二。', source: '招聘软件', tone: 'job' },
  { id: 'old_badge', name: '旧工牌', desc: '门禁已经失效，照片还是三年前的。', source: '抽屉', tone: 'memory' },
  { id: 'child_drawing', name: '孩子画的画', desc: '画里你穿着西装，旁边写着“我爸爸/妈妈是超人”。', source: '家里', tone: 'family' },
  { id: 'rent_contract', name: '房租合同', desc: '下个季度涨租 8%，房东说“已经是很照顾你了”。', source: '房东', tone: 'money' },
  { id: 'bank_balance', name: '银行余额', desc: '一个你不敢多看、又每天都会看的数字。', source: '手机银行', tone: 'money' },
  { id: 'boss_wechat', name: '前领导微信', desc: '最后一条消息停在“有空聊聊”。你没回。', source: '微信', tone: 'job' },
  { id: 'client_praise', name: '客户好评', desc: '一个老客户说：“你做事，我放心。”', source: '私活', tone: 'work' },
  { id: 'license', name: '营业执照', desc: '你还没想好经营范围，但名字已经查重通过。', source: '政务大厅', tone: 'business' },
  { id: 'train_ticket', name: '返乡车票', desc: '一张还没改签的高铁票，终点是老家。', source: '12306', tone: 'home' },
  { id: 'mother_medical', name: '母亲病历', desc: '一沓检查单，日期从三年前排到上个月。', source: '医院', tone: 'family' },
  { id: 'therapy', name: '心理咨询预约', desc: '你预约了周三下午，又取消了一次。', source: '手机', tone: 'health' },
  { id: 'family_photo', name: '一张全家福', desc: '照片里每个人都笑得很用力，包括你。', source: '相册', tone: 'family' },
];

export const CLUE_BY_ID = Object.fromEntries(CLUES.map((c) => [c.id, c]));
