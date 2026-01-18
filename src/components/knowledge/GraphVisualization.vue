<template>
  <div class="graph-visualization">
    <div ref="networkContainer" class="network-container"></div>
    <div v-if="isLoading" class="loading-overlay">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Network } from 'vis-network'
import { DataSet } from 'vis-data'
import { Loading } from '@element-plus/icons-vue'

export default {
  name: 'GraphVisualization',
  components: {
    Loading,
  },
  props: {
    nodes: {
      type: Array,
      default: () => [],
    },
    edges: {
      type: Array,
      default: () => [],
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['node-click', 'edge-click'],
  setup(props, { emit }) {
    const networkContainer = ref(null)
    let network = null
    let nodesDataset = null
    let edgesDataset = null
    let isInitialized = false
    const currentZoomLevel = ref(1) // 当前缩放级别

    // 初始化网络
    const initNetwork = () => {
      if (!networkContainer.value || isInitialized) {
        return
      }

      // 确保容器有尺寸
      const container = networkContainer.value
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        // 延迟初始化
        setTimeout(() => initNetwork(), 100)
        return
      }

      isInitialized = true

      // 创建数据集
      nodesDataset = new DataSet()
      edgesDataset = new DataSet()

      // 计算节点数量，动态调整布局参数
      const nodeCount = props.nodes.length
      const baseSpringLength = 300 // 基础弹簧长度
      const springLength = Math.max(baseSpringLength, Math.sqrt(nodeCount) * 20) // 根据节点数量增加距离
      
      // 配置选项
      const options = {
        nodes: {
          shape: 'dot',
          size: 12, // 减小节点大小
          font: {
            size: 0, // 默认不显示标签文字
            face: 'Arial',
          },
          borderWidth: 2,
          shadow: false, // 关闭阴影以减少视觉干扰
        },
        edges: {
          width: 1, // 减小边宽度
          color: { color: '#d0d0d0', highlight: '#ff4d4f', opacity: 0.3 }, // 降低不透明度
          smooth: {
            type: 'continuous',
            roundness: 0.5,
          },
          arrows: {
            to: {
              enabled: false,
            },
          },
          font: {
            size: 0, // 不显示边标签
            align: 'middle',
          },
        },
        physics: {
          enabled: true,
          stabilization: {
            iterations: 200,
            updateInterval: 25,
            onlyDynamicEdges: false,
            fit: true,
          },
          barnesHut: {
            gravitationalConstant: -80000, // 增加负值让节点更分散（绝对值越大越分散）
            centralGravity: 0.05, // 减少中心引力
            springLength: springLength, // 动态弹簧长度
            springConstant: 0.02, // 减小弹簧常数
            damping: 0.25, // 增加阻尼，减少晃动
            avoidOverlap: 1, // 避免节点重叠
          },
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          zoomView: true,
          dragView: true,
          selectConnectedEdges: false, // 不自动选择连接边
        },
      }

      // 创建网络
      const data = {
        nodes: nodesDataset,
        edges: edgesDataset,
      }

      try {
        network = new Network(networkContainer.value, data, options)
      } catch (e) {
        console.error('创建网络失败:', e)
        isInitialized = false
        return
      }

      // 根据缩放级别更新标签显示
      const updateLabelsByZoom = (zoom) => {
        if (!nodesDataset) return
        
        const zoomThreshold = 1.5 // 缩放超过1.5倍时显示所有标签
        
        nodesDataset.forEach((node) => {
          const shouldShow = zoom >= zoomThreshold || node.raw?.entity_type === 'DISEASE'
          if (shouldShow && node._originalLabel) {
            nodesDataset.update({
              id: node.id,
              label: node._originalLabel,
              font: { size: 11, color: '#333' }
            })
          } else if (!shouldShow && zoom < zoomThreshold) {
            // 只有在缩放级别不够且不是疾病节点时才隐藏
            const isDisease = node.raw?.entity_type === 'DISEASE'
            if (!isDisease) {
              nodesDataset.update({
                id: node.id,
                label: '',
                font: { size: 0 }
              })
            }
          }
        })
      }

      // 节点悬停事件 - 显示标签
      network.on('hoverNode', (params) => {
        if (params.node) {
          const node = nodesDataset.get(params.node)
          if (node && node._originalLabel) {
            nodesDataset.update({
              id: params.node,
              label: node._originalLabel,
              font: { size: 12, color: '#333' }
            })
          }
        }
      })

      // 节点离开悬停 - 根据缩放级别决定是否隐藏标签
      network.on('blurNode', (params) => {
        if (params.node) {
          const node = nodesDataset.get(params.node)
          const zoom = currentZoomLevel.value
          const isDisease = node?.raw?.entity_type === 'DISEASE'
          const shouldShow = zoom >= 1.5 || isDisease
          
          if (!shouldShow) {
            nodesDataset.update({
              id: params.node,
              label: '',
              font: { size: 0 }
            })
          } else if (isDisease) {
            // 保持疾病标签显示
            nodesDataset.update({
              id: params.node,
              label: node._originalLabel,
              font: { size: 11, color: '#333' }
            })
          }
        }
      })

      // 边悬停事件 - 显示标签
      network.on('hoverEdge', (params) => {
        if (params.edge) {
          const edge = edgesDataset.get(params.edge)
          if (edge && edge._originalLabel) {
            edgesDataset.update({
              id: params.edge,
              label: edge._originalLabel,
              font: { size: 11, color: '#666' },
              width: 2
            })
          }
        }
      })

      // 边离开悬停 - 隐藏标签
      network.on('blurEdge', (params) => {
        if (params.edge) {
          edgesDataset.update({
            id: params.edge,
            label: '',
            font: { size: 0 },
            width: 1
          })
        }
      })

      // 监听缩放事件 - 防抖处理，优化性能
      let zoomTimer = null
      network.on('zoom', (params) => {
        currentZoomLevel.value = params.scale
        
        // 防抖处理，减少频繁更新
        if (zoomTimer) {
          clearTimeout(zoomTimer)
        }
        zoomTimer = setTimeout(() => {
          updateLabelsByZoom(params.scale)
        }, 100)
      })

      // 节点点击事件
      network.on('click', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0]
          const node = nodesDataset.get(nodeId)
          if (node) {
            emit('node-click', node)
          }
        } else if (params.edges.length > 0) {
          const edgeId = params.edges[0]
          const edge = edgesDataset.get(edgeId)
          if (edge) {
            emit('edge-click', edge)
          }
        }
      })

      // 保存 updateLabelsByZoom 到网络对象以便外部调用
      network.updateLabelsByZoom = updateLabelsByZoom
      
      // 重新布局方法
      network.relayout = () => {
        if (!network) return
        
        // 计算新的布局参数
        const nodeCount = nodesDataset.length
        const springLength = Math.max(300, Math.sqrt(nodeCount) * 20)
        
        // 重新启用物理引擎，使用新的参数
        network.setOptions({
          physics: {
            enabled: true,
            stabilization: {
              iterations: 200,
              updateInterval: 25,
            },
            barnesHut: {
              gravitationalConstant: -80000,
              centralGravity: 0.05,
              springLength: springLength,
              springConstant: 0.02,
              damping: 0.25,
              avoidOverlap: 1,
            },
          }
        })
        
        // 强制重新计算位置
        network.stabilize(200)
        
        // 等待稳定后重新适配视图
        network.once('stabilizationEnd', () => {
          setTimeout(() => {
            if (network) {
              network.fit({
                animation: {
                  duration: 800,
                  easingFunction: 'easeInOutQuad',
                },
              })
              
              // 再次稳定后关闭物理引擎
              setTimeout(() => {
                if (network) {
                  network.setOptions({
                    physics: { enabled: false }
                  })
                }
              }, 1000)
            }
          }, 300)
        })
      }
    }

    // 更新数据
    const updateData = () => {
      if (!nodesDataset || !edgesDataset) {
        return
      }

      // 转换节点数据 - 默认不显示标签，减少视觉混乱
      const visNodes = props.nodes.map(node => {
        const originalLabel = node.label || `节点 ${node.id}`
        return {
          id: node.id,
          label: '', // 默认不显示标签，减少拥挤
          color: {
            background: node.color || '#999',
            border: node.color || '#999',
            highlight: {
              background: node.color || '#999',
              border: '#333',
            },
          },
          font: {
            size: 0, // 不显示文字
            color: '#333',
          },
          title: `${originalLabel}\n类型: ${node.entity_type || ''}\n标准ID: ${node.standard_id || ''}`,
          // 保存原始标签用于hover显示
          _originalLabel: originalLabel,
          // 保留原始数据
          raw: node.raw || node,
        }
      })

      // 转换边数据 - 默认不显示标签，减少视觉混乱
      const visEdges = props.edges.map(edge => {
        const originalLabel = edge.label || edge.relation_type || ''
        return {
          id: edge.id,
          from: edge.from,
          to: edge.to,
          label: '', // 默认不显示标签
          title: `关系: ${originalLabel}\n关系数: ${edge.relation_count || 1}`,
          color: edge.is_modified 
            ? { color: '#ff4d4f', opacity: 0.4 } 
            : { color: '#d0d0d0', opacity: 0.3 },
          width: 1, // 减小边宽度
          font: { size: 0 }, // 不显示文字
          // 保存原始标签用于hover显示
          _originalLabel: originalLabel,
          // 保留原始数据
          raw: edge.raw || edge,
        }
      })

      // 清空旧数据，然后添加新数据
      nodesDataset.clear()
      edgesDataset.clear()
      nodesDataset.add(visNodes)
      edgesDataset.add(visEdges)

      // 默认显示疾病节点标签
      setTimeout(() => {
        if (nodesDataset && network) {
          nodesDataset.forEach((node) => {
            if (node.raw?.entity_type === 'DISEASE' && node._originalLabel) {
              nodesDataset.update({
                id: node.id,
                label: node._originalLabel,
                font: { size: 11, color: '#333' }
              })
            }
          })
        }
      }, 300)

      // 数据更新后重新布局
      if (network && visNodes.length > 0) {
        setTimeout(() => {
          try {
            // 重新启用物理引擎进行布局
            network.setOptions({
              physics: {
                enabled: true,
                stabilization: {
                  iterations: 150,
                },
                barnesHut: {
                  gravitationalConstant: -80000,
                  centralGravity: 0.05,
                  springLength: Math.max(300, Math.sqrt(visNodes.length) * 20),
                  springConstant: 0.02,
                  damping: 0.25,
                  avoidOverlap: 1,
                },
              }
            })

            // 等待稳定后适配视图
            setTimeout(() => {
              if (network) {
                network.fit({
                  animation: {
                    duration: 500,
                    easingFunction: 'easeInOutQuad',
                  },
                })
                
                // 稳定后关闭物理引擎，减少晃动
                setTimeout(() => {
                  if (network) {
                    network.setOptions({
                      physics: {
                        enabled: false // 布局稳定后关闭物理引擎
                      }
                    })
                  }
                }, 2000) // 2秒后关闭物理引擎
              }
            }, 500)
          } catch (e) {
            // 忽略 ResizeObserver 相关错误
            console.warn('网络适配失败:', e)
          }
        }, 100)
      }
    }

    onMounted(() => {
      // 延迟初始化，确保 DOM 完全渲染
      setTimeout(() => {
        initNetwork()
        if (isInitialized) {
          updateData()
        }
      }, 200)
    })

    // 暴露重新布局方法给父组件
    const relayout = () => {
      if (!network || !nodesDataset) return
      
      // 计算新的布局参数
      const nodeCount = nodesDataset.length
      const springLength = Math.max(300, Math.sqrt(nodeCount) * 20)
      
      // 重新启用物理引擎，使用新的参数
      network.setOptions({
        physics: {
          enabled: true,
          stabilization: {
            iterations: 200,
            updateInterval: 25,
          },
          barnesHut: {
            gravitationalConstant: -80000,
            centralGravity: 0.05,
            springLength: springLength,
            springConstant: 0.02,
            damping: 0.25,
            avoidOverlap: 1,
          },
        }
      })
      
      // 强制重新计算位置
      network.stabilize(200)
      
      // 等待稳定后重新适配视图
      network.once('stabilizationEnd', () => {
        setTimeout(() => {
          if (network) {
            network.fit({
              animation: {
                duration: 800,
                easingFunction: 'easeInOutQuad',
              },
            })
            
            // 再次稳定后关闭物理引擎
            setTimeout(() => {
              if (network) {
                network.setOptions({
                  physics: { enabled: false }
                })
              }
            }, 1000)
          }
        }, 300)
      })
    }

    onBeforeUnmount(() => {
      if (updateTimer) {
        clearTimeout(updateTimer)
      }
      if (network) {
        try {
          network.destroy()
        } catch (e) {
          // 忽略清理时的错误
        }
        network = null
        isInitialized = false
      }
    })

    let updateTimer = null
    watch(
      () => [props.nodes, props.edges],
      () => {
        if (!isInitialized) {
          return
        }
        // 防抖更新，避免频繁触发 ResizeObserver
        if (updateTimer) {
          clearTimeout(updateTimer)
        }
        updateTimer = setTimeout(() => {
          updateData()
        }, 100)
      },
      { deep: true }
    )

    // 聚焦到指定节点
    const focusNode = (nodeId) => {
      if (!network || !nodeId) return
      
      try {
        const positions = network.getPositions([nodeId])
        if (positions[nodeId]) {
          // 聚焦到该节点
          network.moveTo({
            position: positions[nodeId],
            scale: 2, // 放大2倍以便更好地查看
            animation: {
              duration: 800,
              easingFunction: 'easeInOutQuad',
            },
          })
        } else {
          // 如果节点位置不存在，使用fit聚焦
          network.focus(nodeId, {
            scale: 2,
            animation: {
              duration: 800,
              easingFunction: 'easeInOutQuad',
            },
          })
        }
      } catch (e) {
        console.warn('聚焦节点失败:', e)
      }
    }

    return {
      networkContainer,
      relayout,
      focusNode,
    }
  },
}
</script>

<style scoped>
.graph-visualization {
  position: relative;
  width: 100%;
  height: 600px;
  background-color: #fafafa;
  overflow: hidden;
}

.network-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 10;
}

.loading-icon {
  font-size: 32px;
  color: #1a91c1;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-overlay span {
  color: #666;
  font-size: 14px;
}
</style>
