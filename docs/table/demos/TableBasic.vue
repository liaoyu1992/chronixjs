<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';

const columns = [
  { id: 'name', field: 'name', headerName: '姓名', width: 200, sortable: true },
  { id: 'email', field: 'email', headerName: '邮箱', width: 300 },
  { id: 'role', field: 'role', headerName: '角色', width: 150, sortable: true },
  { id: 'dept', field: 'dept', headerName: '部门', width: 150, sortable: true },
  { id: 'city', field: 'city', headerName: '城市', flex: 1, sortable: true },
];

const names = [
  '张伟',
  '王芳',
  '李娜',
  '刘洋',
  '陈静',
  '杨磊',
  '赵敏',
  '黄涛',
  '周婷',
  '吴昊',
  '徐丽',
  '孙鹏',
  '马超',
  '朱琳',
  '胡军',
  '郭蓉',
  '林峰',
  '何洁',
  '高峰',
  '罗丹',
];
const roles = ['工程师', '设计师', '产品经理', '测试工程师', '运维工程师'];
const depts = ['研发部', '设计部', '产品部', '测试部', '运维部'];
const cities = ['北京', '上海', '深圳', '杭州', '广州', '成都', '武汉', '南京'];

const rows = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  data: {
    name: names[i],
    email: `user${i + 1}@chronixjs.com`,
    role: roles[i % roles.length],
    dept: depts[i % depts.length],
    city: cities[i % cities.length],
  },
}));
</script>

<template>
  <div style="height: calc(100vh - 200px); min-height: 500px">
    <ChronixTable :columns="columns" :rows="rows" />
  </div>
</template>
