<script setup lang="ts">
import { ref } from 'vue';
import { ChronixTable } from '@chronixjs/table-vue3';
import type { ColumnSpec, RowSpec, CellValueChangePayload } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: '名称', width: 160, editable: true },
  { id: 'qty', field: 'qty', headerName: '数量', width: 100, type: 'number', editable: true },
  { id: 'price', field: 'price', headerName: '单价', width: 100, type: 'number', editable: true },
  { id: 'note', field: 'note', headerName: '备注', flex: 1, editable: true },
];

const products = [
  { name: '苹果', qty: 50, price: 5.5, note: '新鲜到货' },
  { name: '香蕉', qty: 80, price: 3.2, note: '促销中' },
  { name: '橙子', qty: 35, price: 6.8, note: '' },
  { name: '葡萄', qty: 60, price: 12.5, note: '进口' },
  { name: '西瓜', qty: 20, price: 2.0, note: '按个卖' },
  { name: '草莓', qty: 45, price: 18.0, note: '限时' },
  { name: '蓝莓', qty: 30, price: 25.0, note: '有机' },
  { name: '芒果', qty: 55, price: 8.5, note: '海南直发' },
  { name: '榴莲', qty: 15, price: 35.0, note: '泰国进口' },
  { name: '樱桃', qty: 25, price: 30.0, note: '智利空运' },
  { name: '火龙果', qty: 40, price: 7.5, note: '红心' },
  { name: '猕猴桃', qty: 50, price: 6.0, note: '新西兰' },
  { name: '荔枝', qty: 60, price: 10.0, note: '广东产地' },
  { name: '龙眼', qty: 35, price: 9.0, note: '福建' },
  { name: '山竹', qty: 20, price: 22.0, note: '泰国进口' },
  { name: '菠萝', qty: 70, price: 4.0, note: '海南' },
  { name: '木瓜', qty: 30, price: 5.5, note: '云南' },
  { name: '柚子', qty: 40, price: 6.5, note: '福建平和' },
  { name: '红枣', qty: 100, price: 15.0, note: '新疆' },
  { name: '核桃', qty: 80, price: 20.0, note: '云南' },
];

const rows = ref<RowSpec[]>(products.map((p, i) => ({ id: String(i + 1), data: { ...p } })));

function onCellValueChange(payload: CellValueChangePayload): void {
  rows.value = rows.value.map((row) => {
    if (row.id !== payload.row.id) return row;
    return {
      ...row,
      data: { ...row.data, [payload.column.field ?? payload.column.id]: payload.newValue },
    };
  });
}
</script>

<template>
  <div style="height: calc(100vh - 200px); min-height: 500px">
    <ChronixTable :columns="columns" :rows="rows" @cell-value-change="onCellValueChange" />
  </div>
</template>
