// composables/useNodeConfig.js
import { ref } from 'vue'
import {
  Bug, // 病原体 - 病毒/细菌
  Aim, // 感染部位 - 瞄准/定位
  FirstAidKit, // 临床症状 - 医疗/健康
  Search, // 诊断方法 - 搜索/检查
  MedicineBox, // 治疗方案 - 药物/药箱
  Shield, // 预防策略 - 盾牌
  CopyDocument, // 肝硬化阶段 - 分层
  Warning, // 并发症 - 警告三角
} from '@element-plus/icons-vue'

export const useNodeConfig = () => {
  const nodeTypes = ref([
    {
      label: '病原体',
      value: 'pathogen',
      color: '#ff6b6b',
      icon: Bug,
    },
    {
      label: '感染部位',
      value: 'infection_site',
      color: '#4ecdc4',
      icon: Aim,
    },
    {
      label: '临床症状',
      value: 'clinical_symptom',
      color: '#45b7d1',
      icon: FirstAidKit,
    },
    {
      label: '诊断方法',
      value: 'diagnosis_method',
      color: '#96ceb4',
      icon: Search,
    },
    {
      label: '治疗方案',
      value: 'treatment_plan',
      color: '#ffeaa7',
      icon: MedicineBox,
    },
    {
      label: '预防策略',
      value: 'prevention_strategy',
      color: '#dda0dd',
      icon: Shield,
    },
    {
      label: '肝硬化阶段',
      value: 'cirrhosis_stage',
      color: '#98d8c8',
      icon: CopyDocument,
    },
    {
      label: '并发症',
      value: 'complication',
      color: '#ff7675',
      icon: Warning,
    },
  ])

  const relationTypes = ref([
    { label: '致病', value: 'causes' },
    { label: '表现为', value: 'manifests_as' },
    { label: '诊断依据', value: 'diagnosed_by' },
    { label: '治疗方法', value: 'treated_with' },
    { label: '并发', value: 'complicates_with' },
    { label: '预防', value: 'prevented_by' },
    { label: '抗性', value: 'resistant_to' },
    { label: '协同作用', value: 'synergizes_with' },
    { label: '发生在', value: 'occurs_in' },
    { label: '关联', value: 'associated_with' },
  ])

  const getNodeConfig = (type) => {
    return (
      nodeTypes.value.find((node) => node.value === type) || {
        label: type,
        value: type,
        color: '#95a5a6',
        icon: Bug, // 默认图标
      }
    )
  }

  const getNodeColor = (type) => getNodeConfig(type).color
  const getNodeLabel = (type) => getNodeConfig(type).label
  const getNodeIcon = (type) => getNodeConfig(type).icon

  const getRelationLabel = (type) => {
    const relation = relationTypes.value.find((rel) => rel.value === type)
    return relation ? relation.label : type
  }

  return {
    nodeTypes,
    relationTypes,
    getNodeConfig,
    getNodeColor,
    getNodeLabel,
    getNodeIcon,
    getRelationLabel,
  }
}
