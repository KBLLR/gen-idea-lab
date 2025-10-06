import React from 'react';
import { Handle, Position } from 'reactflow';

const AIAgentNode = ({ data }) => {
  return (
    <div style={{ 
      border: '1px solid #777', 
      padding: '10px', 
      borderRadius: '5px', 
      background: '#f0f0f0', 
      width: '200px' 
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        fontWeight: 'bold', 
        marginBottom: '10px' 
      }}>
        <div>{data.label}</div>
        <div>
          <button style={{ marginRight: '5px' }}>E</button>
          <button>D</button>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          {data.inputs && data.inputs.map((input, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              <Handle type="target" position={Position.Left} id={input.id} />
              <span style={{ marginLeft: '5px' }}>{input.label}</span>
            </div>
          ))}
        </div>
        <div>
          {data.outputs && data.outputs.map((output, index) => (
            <div key={index} style={{ marginBottom: '5px', textAlign: 'right' }}>
              <span style={{ marginRight: '5px' }}>{output.label}</span>
              <Handle type="source" position={Position.Right} id={output.id} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIAgentNode;
